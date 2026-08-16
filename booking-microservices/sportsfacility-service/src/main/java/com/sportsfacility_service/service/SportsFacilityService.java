package com.sportsfacility_service.service;

import com.sportsfacility_service.configuration.feignclients.ClubFeignClient;
import com.sportsfacility_service.persistence.ExceptionType;
import com.sportsfacility_service.persistence.FacilityOpeningHours;
import com.sportsfacility_service.persistence.FacilityScheduleException;
import com.sportsfacility_service.persistence.ISportsFacilityRepository;
import com.sportsfacility_service.persistence.SportType;
import com.sportsfacility_service.persistence.SportsFacility;
import com.sportsfacility_service.persistence.TimeInterval;
import com.sportsfacility_service.presentation.ClubDto;
import com.sportsfacility_service.presentation.CreateSportsFacility;
import com.sportsfacility_service.presentation.ExceptionRequest;
import com.sportsfacility_service.presentation.IntervalDto;
import com.sportsfacility_service.presentation.OpeningHoursDto;
import com.sportsfacility_service.presentation.ScheduleRequest;
import com.sportsfacility_service.presentation.SearchRequest;
import com.sportsfacility_service.util.JwtUtil;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.DayOfWeek;
import java.util.ArrayList;
import java.util.EnumMap;
import java.util.List;
import java.util.Map;

@Service
public class SportsFacilityService {

    private final ISportsFacilityRepository sportsFacilityRepository;
    private final ClubFeignClient clubFeignClient;

    public SportsFacilityService(ISportsFacilityRepository sportsFacilityRepository, ClubFeignClient clubFeignClient, JwtUtil jwtUtil) {
        this.sportsFacilityRepository = sportsFacilityRepository;
        this.clubFeignClient = clubFeignClient;
    }

    public List<SportsFacility> getAllFacilitiesByRequest(HttpServletRequest request){
        ClubDto clubDto = clubFeignClient.getClub();
        return sportsFacilityRepository.findByClubId(clubDto.getId());
    }

    public SportsFacility getFacilityById(HttpServletRequest request, Long id){
        return sportsFacilityRepository.findById(id).orElse(null);
    }

    public List<SportsFacility> getFacilitiesByFilter(SearchRequest searchRequest) {
        if (searchRequest == null) return List.of();
        List<SportType> sportTypes = searchRequest.sportTypes();
        if (sportTypes == null || sportTypes.isEmpty()) {
            return sportsFacilityRepository.findByClubIdIn(searchRequest.clubIds());
        }
        return sportsFacilityRepository.findByClubIdInAndSportTypeIn(searchRequest.clubIds(), sportTypes);
    }

    public SportsFacility createSportFacility(HttpServletRequest request, CreateSportsFacility facilityRequest){
        ClubDto clubDto = clubFeignClient.getClub();
        SportType sportType = facilityRequest.sportType();
        long facilityNumber = sportsFacilityRepository.countByClubIdAndSportType(clubDto.getId(), sportType) + 1;

        SportsFacility sf = SportsFacility.builder()
                .clubId(clubDto.getId())
                .sportType(facilityRequest.sportType())
                .name(sportType.toString() + "-" + facilityNumber)
                .build();

        return sportsFacilityRepository.save(sf);
    }

    public void deleteFacility(HttpServletRequest request, Long id){
        ClubDto clubDto = clubFeignClient.getClub();
        SportsFacility sf = sportsFacilityRepository.findById(id).orElse(null);
        if (clubDto == null || sf == null || !sf.getClubId().equals(clubDto.getId())) return;
        sportsFacilityRepository.deleteById(id);
    }

    public List<SportsFacility> getAllByClubId(Long id){
        return sportsFacilityRepository.findByClubId(id);
    }

    /** Replaces the facility's whole weekly availability with the provided intervals. */
    @Transactional
    public SportsFacility updateSchedule(HttpServletRequest request, Long facilityId, ScheduleRequest req) {
        if (req == null || req.openingHours() == null) {
            throw new IllegalArgumentException("El horario es obligatorio");
        }

        SportsFacility facility = getOwnedFacility(facilityId);

        List<FacilityOpeningHours> newHours = new ArrayList<>();
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
                newHours.add(FacilityOpeningHours.builder()
                        .dayOfWeek(day)
                        .startTime(interval.getStartTime())
                        .endTime(interval.getEndTime())
                        .build());
            }
        });

        facility.getOpeningHours().clear();
        facility.getOpeningHours().addAll(newHours);
        return sportsFacilityRepository.save(facility);
    }

    @Transactional
    public List<FacilityScheduleException> getExceptions(HttpServletRequest request, Long facilityId) {
        SportsFacility facility = sportsFacilityRepository.findById(facilityId)
                .orElseThrow(() -> new RuntimeException("Instalación no encontrada"));
        return facility.getExceptions();
    }

    @Transactional
    public SportsFacility addException(HttpServletRequest request, Long facilityId, ExceptionRequest req) {
        if (req == null || req.date() == null || req.type() == null) {
            throw new IllegalArgumentException("La fecha y el tipo de excepción son obligatorios");
        }

        SportsFacility facility = getOwnedFacility(facilityId);

        List<TimeInterval> intervals = new ArrayList<>();
        if (req.type() == ExceptionType.CUSTOM_HOURS || req.type() == ExceptionType.BLOCKED) {
            if (req.intervals() == null || req.intervals().isEmpty()) {
                throw new IllegalArgumentException("Este tipo de excepción debe tener al menos un intervalo");
            }
            for (IntervalDto dto : req.intervals()) {
                intervals.add(new TimeInterval(dto.startTime(), dto.endTime()));
            }
            ScheduleValidator.validateSameDayIntervals(intervals);
        }

        facility.getExceptions().removeIf(e -> e.getDate().equals(req.date()));
        facility.getExceptions().add(FacilityScheduleException.builder()
                .date(req.date())
                .type(req.type())
                .note(req.note())
                .intervals(intervals)
                .build());

        return sportsFacilityRepository.save(facility);
    }

    @Transactional
    public SportsFacility deleteException(HttpServletRequest request, Long facilityId, Long exceptionId) {
        SportsFacility facility = getOwnedFacility(facilityId);
        facility.getExceptions().removeIf(e -> e.getId().equals(exceptionId));
        return sportsFacilityRepository.save(facility);
    }

    /** Loads a facility and verifies it belongs to the caller's club. */
    private SportsFacility getOwnedFacility(Long facilityId) {
        SportsFacility facility = sportsFacilityRepository.findById(facilityId)
                .orElseThrow(() -> new RuntimeException("Instalación no encontrada"));
        ClubDto clubDto = clubFeignClient.getClub();
        if (clubDto == null || !facility.getClubId().equals(clubDto.getId())) {
            throw new RuntimeException("No autorizado");
        }
        return facility;
    }

}
