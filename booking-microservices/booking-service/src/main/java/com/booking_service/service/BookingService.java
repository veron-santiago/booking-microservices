package com.booking_service.service;

import com.booking_service.availability.AvailabilityService;
import com.booking_service.availability.TimeRange;
import com.booking_service.availability.TimeRanges;
import com.booking_service.configuration.feignclients.ClubFeignClient;
import com.booking_service.configuration.feignclients.SportsFacilityFeignClient;
import com.booking_service.persistence.Booking;
import com.booking_service.persistence.IBookingRepository;
import com.booking_service.presentation.BookingRequest;
import com.booking_service.presentation.dtos.ClubDto;
import com.booking_service.presentation.dtos.IntervalDto;
import com.booking_service.presentation.dtos.SportsFacilityDto;
import com.booking_service.util.JwtUtil;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.ws.rs.NotFoundException;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Service
public class BookingService {

    private final IBookingRepository bookingRepository;
    private final ClubFeignClient clubFeignClient;
    private final SportsFacilityFeignClient facilityFeignClient;
    private final AvailabilityService availabilityService;
    private final JwtUtil jwtUtil;

    public BookingService(IBookingRepository bookingRepository, ClubFeignClient clubFeignClient,
                          SportsFacilityFeignClient facilityFeignClient,
                          AvailabilityService availabilityService, JwtUtil jwtUtil) {
        this.bookingRepository = bookingRepository;
        this.clubFeignClient = clubFeignClient;
        this.facilityFeignClient = facilityFeignClient;
        this.availabilityService = availabilityService;
        this.jwtUtil = jwtUtil;
    }

    public List<Booking> getMyBookings(HttpServletRequest request) {
        Long userId = jwtUtil.extractUserId(request);
        return bookingRepository.findByUserId(userId);
    }

    public List<Booking> getMyClubBookings(HttpServletRequest request){
        ClubDto club = clubFeignClient.getMyClub();
        if (club == null || !jwtUtil.extractRole(request).equals("CLUB")) return null;
        List<SportsFacilityDto> facilities = facilityFeignClient.getSportsFacilityByClubId(club.getId());
        if (facilities == null || facilities.isEmpty()) return null;
        List<Long> facilitiesIds = facilities.stream().map(SportsFacilityDto::getId).toList();
        return bookingRepository.findBySportsFacilityIdIn(facilitiesIds);
    }

    public Booking createBooking(HttpServletRequest request, BookingRequest req) {

        Long userId = jwtUtil.extractUserId(request);

        if (req.start() == null || req.durationMinutes() == null) {
            throw new IllegalArgumentException("Datos inválidos");
        }

        if (req.durationMinutes() <= 0 || req.durationMinutes() > 180) {
            throw new IllegalArgumentException("Duración inválida");
        }

        LocalDateTime start = req.start();
        LocalDateTime end = start.plusMinutes(req.durationMinutes());

        if (end.isBefore(start) || end.equals(start)) {
            throw new IllegalArgumentException("Rango de tiempo inválido");
        }

        if (start.isBefore(LocalDateTime.now())) {
            throw new IllegalArgumentException("No podés reservar en el pasado");
        }

        if (!start.toLocalDate().equals(end.toLocalDate())) {
            throw new IllegalArgumentException("La reserva no puede cruzar días");
        }

        SportsFacilityDto facilityDto = facilityFeignClient.getSportsFacilityById(req.sportsFacilityId());
        if (facilityDto == null) throw new NotFoundException("Instalación no encontrada");
        ClubDto clubDto = clubFeignClient.getClubById(facilityDto.getClubId());
        if (clubDto == null) throw new NotFoundException("Club no encontrado");

        LocalDate date = start.toLocalDate();
        List<TimeRange> effective = availabilityService.effectiveAvailability(clubDto, facilityDto, date);

        if (!TimeRanges.contains(effective, start.toLocalTime(), end.toLocalTime())) {
            throw new IllegalArgumentException("La reserva está fuera de la disponibilidad de la instalación");
        }

        List<Booking> bookings =
                bookingRepository.findBySportsFacilityId(req.sportsFacilityId());

        boolean conflict = bookings.stream().anyMatch(b ->
                b.getStart().isBefore(end) &&
                        b.getEnd().isAfter(start)
        );

        if (conflict) {
            throw new RuntimeException("Horario no disponible");
        }

        Booking booking = Booking.builder()
                .userId(userId)
                .sportsFacilityId(req.sportsFacilityId())
                .start(start)
                .end(end)
                .facilityName(facilityDto.getName())
                .clubName(clubDto.getName())
                .build();

        return bookingRepository.save(booking);
    }

    /** Free (bookable) intervals of a facility on a date, taking bookings into account. */
    public List<IntervalDto> getAvailability(Long facilityId, LocalDate date) {
        if (facilityId == null || date == null) {
            return List.of();
        }

        SportsFacilityDto facilityDto = facilityFeignClient.getSportsFacilityById(facilityId);
        if (facilityDto == null) return List.of();
        ClubDto clubDto = clubFeignClient.getClubById(facilityDto.getClubId());
        if (clubDto == null) return List.of();

        List<Booking> bookings = bookingRepository.findBookingsOverlappingDay(
                List.of(facilityId), date.atStartOfDay(), date.atTime(23, 59, 59));

        List<TimeRange> free = availabilityService.freeAvailability(
                clubDto, facilityDto, date, bookingsToRanges(bookings, date));

        List<IntervalDto> result = new ArrayList<>();
        for (TimeRange r : free) {
            result.add(new IntervalDto(r.start(), r.end()));
        }
        return result;
    }

    static List<TimeRange> bookingsToRanges(List<Booking> bookings, LocalDate date) {
        List<TimeRange> ranges = new ArrayList<>();
        if (bookings == null) {
            return ranges;
        }
        for (Booking b : bookings) {
            if (b.getStart() == null || b.getEnd() == null) {
                continue;
            }
            if (!b.getStart().toLocalDate().equals(date)) {
                continue;
            }
            if (b.getStart().toLocalTime().isBefore(b.getEnd().toLocalTime())) {
                ranges.add(new TimeRange(b.getStart().toLocalTime(), b.getEnd().toLocalTime()));
            }
        }
        return ranges;
    }

    public void deleteBooking(HttpServletRequest request, Long bookingId) {
        Long userId = jwtUtil.extractUserId(request);

        Booking booking = bookingRepository.findById(bookingId).orElseThrow(() -> new RuntimeException("Reserva no encontrada"));

        if (!booking.getUserId().equals(userId)) {
            throw new RuntimeException("No autorizado");
        }

        bookingRepository.delete(booking);
    }

}
