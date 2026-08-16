package com.booking_service.service;

import com.booking_service.availability.AvailabilityService;
import com.booking_service.availability.TimeRange;
import com.booking_service.configuration.feignclients.ClubFeignClient;
import com.booking_service.configuration.feignclients.SportsFacilityFeignClient;
import com.booking_service.persistence.Booking;
import com.booking_service.persistence.IBookingRepository;
import com.booking_service.presentation.SearchFacilitiesRequest;
import com.booking_service.presentation.SearchRequest;
import com.booking_service.presentation.SearchResponse;
import com.booking_service.presentation.dtos.ClubDto;
import com.booking_service.presentation.dtos.SportsFacilityDto;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class SearchService {

    private final ClubFeignClient clubFeignClient;
    private final IBookingRepository bookingRepository;
    private final SportsFacilityFeignClient facilityFeignClient;
    private final AvailabilityService availabilityService;

    public SearchService(ClubFeignClient clubFeignClient, SportsFacilityFeignClient facilityFeignClient,
                         IBookingRepository bookingRepository, AvailabilityService availabilityService) {
        this.clubFeignClient = clubFeignClient;
        this.facilityFeignClient = facilityFeignClient;
        this.bookingRepository = bookingRepository;
        this.availabilityService = availabilityService;
    }

    public List<SearchResponse> search(SearchRequest req) {
        List<ClubDto> clubs = clubFeignClient.getNearbyClubs(req.lat(), req.lon(), req.radius());
        if (clubs.isEmpty()) return List.of();

        Map<Long, ClubDto> clubsById = clubs.stream().collect(Collectors.toMap(
                ClubDto::getId,
                c -> c,
                (a, b) -> a
        ));
        List<Long> clubIds = clubs.stream().map(ClubDto::getId).toList();

        List<SportsFacilityDto> facilities = facilityFeignClient.search(
                new SearchFacilitiesRequest(clubIds, req.sportTypes())
        );
        if (facilities.isEmpty()) return List.of();

        if (req.date() == null) {
            return facilities.stream()
                    .map(f -> mapToResponse(f, clubsById.get(f.getClubId()), true))
                    .toList();
        }

        LocalDate date = req.date();
        LocalDateTime startOfDay = date.atStartOfDay();
        LocalDateTime endOfDay = date.atTime(23, 59, 59);

        List<Long> facilityIds = facilities.stream().map(SportsFacilityDto::getId).toList();
        List<Booking> bookings = bookingRepository.findBookingsOverlappingDay(facilityIds, startOfDay, endOfDay);
        Map<Long, List<Booking>> bookingsByFacility = bookings.stream()
                .collect(Collectors.groupingBy(Booking::getSportsFacilityId));

        return facilities.stream()
                .map(f -> {
                    ClubDto club = clubsById.get(f.getClubId());
                    boolean available = isAvailable(club, f, date,
                            bookingsByFacility.getOrDefault(f.getId(), List.of()));
                    return mapToResponse(f, club, available);
                })
                .toList();
    }

    private boolean isAvailable(ClubDto club, SportsFacilityDto facility, LocalDate date, List<Booking> bookings) {
        List<TimeRange> free = availabilityService.freeAvailability(
                club, facility, date, BookingService.bookingsToRanges(bookings, date));
        return !free.isEmpty();
    }

    private SearchResponse mapToResponse(SportsFacilityDto facility, ClubDto club, boolean available) {
        if (club == null) {
            throw new RuntimeException("Club no encontrado");
        }

        return new SearchResponse(
                facility.getId(),
                facility.getName(),
                facility.getSportType(),
                club.getId(),
                club.getName(),
                club.getAddress(),
                available
        );
    }
}
