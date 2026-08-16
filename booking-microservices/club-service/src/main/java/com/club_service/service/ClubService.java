package com.club_service.service;

import com.club_service.persistence.Club;
import com.club_service.persistence.ClubOpeningHours;
import com.club_service.persistence.ClubScheduleException;
import com.club_service.persistence.ExceptionType;
import com.club_service.persistence.IClubRepository;
import com.club_service.persistence.TimeInterval;
import com.club_service.presentation.ClubLocationRequest;
import com.club_service.presentation.CreateClubRequest;
import com.club_service.presentation.ExceptionRequest;
import com.club_service.presentation.IntervalDto;
import com.club_service.presentation.OpeningHoursDto;
import com.club_service.presentation.ScheduleRequest;
import com.club_service.util.JwtUtil;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.DayOfWeek;
import java.util.ArrayList;
import java.util.EnumMap;
import java.util.List;
import java.util.Map;

@Service
public class ClubService {

    private final IClubRepository clubRepository;
    private final JwtUtil jwtUtil;

    public ClubService(IClubRepository clubRepository, JwtUtil jwtUtil) {
        this.clubRepository = clubRepository;
        this.jwtUtil = jwtUtil;
    }

    @Transactional
    public Club getClubById(Long id){
        return clubRepository.findById(id).orElse(null);
    }

    @Transactional
    public Club getMyClub(HttpServletRequest request) {
        Long userId = jwtUtil.extractUserId(request);
        return clubRepository.findByUserId(userId).orElse(null);
    }

    @Transactional
    public List<Club> getClubsByLocation(double latitude, double longitude, double radiusKm){

        if (latitude < -90 || latitude > 90)
            throw new IllegalArgumentException("Latitud inválida");
        if (longitude < -180 || longitude > 180)
            throw new IllegalArgumentException("Longitud inválida");
        if (radiusKm <= 0)
            throw new IllegalArgumentException("Radio inválido");

        return clubRepository.findNearbyClubs(latitude, longitude, radiusKm);
    }

    public Club updateLocation(HttpServletRequest request, ClubLocationRequest req){
        Club club = getClubByRequest(request);

        if (req.latitude() < -90 || req.latitude() > 90)
            throw new IllegalArgumentException("Latitud inválida");
        if (req.longitude() < -180 || req.longitude() > 180)
            throw new IllegalArgumentException("Longitud inválida");

        club.setLongitude(req.longitude());
        club.setLatitude(req.latitude());
        club.setAddress(req.address());
        return clubRepository.save(club);
    }

    public Club createFromUser(CreateClubRequest request) {
        Club club = new Club();
        club.setUserId(request.ownerId());
        club.setName(request.name());
        return clubRepository.save(club);
    }

    @Transactional
    public Club updateSchedule(HttpServletRequest request, ScheduleRequest req) {
        if (req == null || req.openingHours() == null) {
            throw new IllegalArgumentException("El horario es obligatorio");
        }

        Club club = getClubByRequest(request);

        List<ClubOpeningHours> newHours = new ArrayList<>();
        Map<DayOfWeek, List<TimeInterval>> byDay = new EnumMap<>(DayOfWeek.class);

        for (OpeningHoursDto dto : req.openingHours()) {
            if (dto.dayOfWeek() == null) {
                throw new IllegalArgumentException("Cada intervalo debe indicar el día de la semana");
            }
            if (dto.startTime() == null || dto.endTime() == null) {
                throw new IllegalArgumentException("Cada intervalo debe tener hora de inicio y fin");
            }
            byDay.computeIfAbsent(dto.dayOfWeek(), d -> new ArrayList<>())
                    .add(new TimeInterval(dto.startTime(), dto.endTime()));
        }

        byDay.forEach((day, intervals) -> {
            ScheduleValidator.validateSameDayIntervals(intervals);
            for (TimeInterval interval : intervals) {
                newHours.add(ClubOpeningHours.builder()
                        .dayOfWeek(day)
                        .startTime(interval.getStartTime())
                        .endTime(interval.getEndTime())
                        .build());
            }
        });

        club.getOpeningHours().clear();
        club.getOpeningHours().addAll(newHours);
        return clubRepository.save(club);
    }

    @Transactional
    public List<ClubScheduleException> getMyExceptions(HttpServletRequest request) {
        Club club = getClubByRequest(request);
        return club.getExceptions();
    }

    @Transactional
    public Club addException(HttpServletRequest request, ExceptionRequest req) {
        if (req == null || req.date() == null || req.type() == null) {
            throw new IllegalArgumentException("La fecha y el tipo de excepción son obligatorios");
        }

        Club club = getClubByRequest(request);

        List<TimeInterval> intervals = new ArrayList<>();
        if (req.type() == ExceptionType.CUSTOM_HOURS) {
            if (req.intervals() == null || req.intervals().isEmpty()) {
                throw new IllegalArgumentException("Un horario especial debe tener al menos un intervalo");
            }
            for (IntervalDto dto : req.intervals()) {
                intervals.add(new TimeInterval(dto.startTime(), dto.endTime()));
            }
            ScheduleValidator.validateSameDayIntervals(intervals);
        }

        club.getExceptions().removeIf(e -> e.getDate().equals(req.date()));
        club.getExceptions().add(ClubScheduleException.builder()
                .date(req.date())
                .type(req.type())
                .note(req.note())
                .intervals(intervals)
                .build());

        return clubRepository.save(club);
    }

    @Transactional
    public Club deleteException(HttpServletRequest request, Long exceptionId) {
        Club club = getClubByRequest(request);
        club.getExceptions().removeIf(e -> e.getId().equals(exceptionId));
        return clubRepository.save(club);
    }

    private Club getClubByRequest(HttpServletRequest request){
        Long id = jwtUtil.extractUserId(request);
        return clubRepository.findByUserId(id)
                .orElseThrow(() -> new RuntimeException("Club no encontrado"));
    }

}
