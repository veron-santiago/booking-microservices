package com.sportsfacility_service.service;

import com.sportsfacility_service.configuration.feignclients.ClubFeignClient;
import com.sportsfacility_service.persistence.*;
import com.sportsfacility_service.presentation.ClubDto;
import com.sportsfacility_service.presentation.CreateSportsFacility;
import com.sportsfacility_service.presentation.ExceptionRequest;
import com.sportsfacility_service.presentation.IntervalDto;
import com.sportsfacility_service.presentation.OpeningHoursDto;
import com.sportsfacility_service.presentation.ScheduleRequest;
import com.sportsfacility_service.presentation.SearchRequest;
import jakarta.servlet.http.HttpServletRequest;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class SportsFacilityServiceTest {

    @Mock
    private ISportsFacilityRepository repository;

    @Mock
    private ClubFeignClient clubFeignClient;

    @InjectMocks
    private SportsFacilityService service;

    private HttpServletRequest request() {
        return mock(HttpServletRequest.class);
    }

    private ClubDto club(Long id) {
        ClubDto club = new ClubDto();
        club.setId(id);
        return club;
    }

    @Test
    void shouldReturnFacilitiesByClubFromRequest() {
        when(clubFeignClient.getClub()).thenReturn(club(1L));
        when(repository.findByClubId(1L)).thenReturn(List.of(new SportsFacility()));

        List<SportsFacility> result = service.getAllFacilitiesByRequest(request());

        assertFalse(result.isEmpty());
    }

    @Test
    void shouldReturnFacilityById() {
        SportsFacility sf = new SportsFacility();
        sf.setId(10L);
        sf.setClubId(1L);

        when(repository.findById(10L)).thenReturn(Optional.of(sf));

        SportsFacility result = service.getFacilityById(request(), 10L);

        assertNotNull(result);
        assertEquals(10L, result.getId());
    }

    @Test
    void shouldReturnAllFacilitiesWhenNoSportTypes() {
        SearchRequest req = new SearchRequest(List.of(1L, 2L), List.of());

        when(repository.findByClubIdIn(List.of(1L, 2L)))
                .thenReturn(List.of(new SportsFacility()));

        List<SportsFacility> result = service.getFacilitiesByFilter(req);

        assertFalse(result.isEmpty());
    }

    @Test
    void shouldReturnFilteredFacilitiesBySportType() {
        SearchRequest req = new SearchRequest(List.of(1L, 2L), List.of(SportType.FOOTBALL));

        when(repository.findByClubIdInAndSportTypeIn(List.of(1L, 2L), List.of(SportType.FOOTBALL)))
                .thenReturn(List.of(new SportsFacility()));

        List<SportsFacility> result = service.getFacilitiesByFilter(req);

        assertFalse(result.isEmpty());
    }

    @Test
    void shouldReturnEmptyWhenRequestNull() {
        List<SportsFacility> result = service.getFacilitiesByFilter(null);
        assertTrue(result.isEmpty());
    }

    @Test
    void shouldCreateFacilityWithCorrectName() {
        CreateSportsFacility req = new CreateSportsFacility(SportType.FOOTBALL);

        when(clubFeignClient.getClub()).thenReturn(club(1L));
        when(repository.countByClubIdAndSportType(1L, SportType.FOOTBALL)).thenReturn(2L);
        when(repository.save(any())).thenAnswer(i -> i.getArgument(0));

        SportsFacility result = service.createSportFacility(request(), req);

        assertNotNull(result);
        assertEquals("FOOTBALL-3", result.getName());
        assertEquals(1L, result.getClubId());
    }

    @Test
    void shouldDeleteFacilityWhenBelongsToClub() {
        SportsFacility sf = new SportsFacility();
        sf.setId(10L);
        sf.setClubId(1L);

        when(clubFeignClient.getClub()).thenReturn(club(1L));
        when(repository.findById(10L)).thenReturn(Optional.of(sf));

        service.deleteFacility(request(), 10L);

        verify(repository).deleteById(10L);
    }

    @Test
    void shouldNotDeleteWhenFacilityDoesNotBelongToClub() {
        SportsFacility sf = new SportsFacility();
        sf.setId(10L);
        sf.setClubId(2L);

        when(clubFeignClient.getClub()).thenReturn(club(1L));
        when(repository.findById(10L)).thenReturn(Optional.of(sf));

        service.deleteFacility(request(), 10L);

        verify(repository, never()).deleteById(any());
    }

    @Test
    void shouldReturnFacilitiesByClubId() {
        when(repository.findByClubId(1L)).thenReturn(List.of(new SportsFacility()));

        List<SportsFacility> result = service.getAllByClubId(1L);

        assertFalse(result.isEmpty());
    }

    @Test
    void shouldUpdateWeeklySchedule() {
        SportsFacility sf = SportsFacility.builder().id(10L).clubId(1L).build();

        when(repository.findById(10L)).thenReturn(Optional.of(sf));
        when(clubFeignClient.getClub()).thenReturn(club(1L));
        when(repository.save(any())).thenAnswer(i -> i.getArgument(0));

        ScheduleRequest req = new ScheduleRequest(List.of(
                new OpeningHoursDto(DayOfWeek.MONDAY, LocalTime.of(10, 0), LocalTime.of(12, 0)),
                new OpeningHoursDto(DayOfWeek.MONDAY, LocalTime.of(16, 0), LocalTime.of(20, 0))
        ));

        SportsFacility result = service.updateSchedule(request(), 10L, req);

        assertEquals(2, result.getOpeningHours().size());
    }

    @Test
    void shouldRejectScheduleUpdateWhenNotOwner() {
        SportsFacility sf = SportsFacility.builder().id(10L).clubId(2L).build();

        when(repository.findById(10L)).thenReturn(Optional.of(sf));
        when(clubFeignClient.getClub()).thenReturn(club(1L));

        ScheduleRequest req = new ScheduleRequest(List.of(
                new OpeningHoursDto(DayOfWeek.MONDAY, LocalTime.of(10, 0), LocalTime.of(12, 0))
        ));

        assertThrows(RuntimeException.class,
                () -> service.updateSchedule(request(), 10L, req));
    }

    @Test
    void shouldAddBlockedException() {
        SportsFacility sf = SportsFacility.builder().id(10L).clubId(1L).build();

        when(repository.findById(10L)).thenReturn(Optional.of(sf));
        when(clubFeignClient.getClub()).thenReturn(club(1L));
        when(repository.save(any())).thenAnswer(i -> i.getArgument(0));

        ExceptionRequest req = new ExceptionRequest(
                LocalDate.of(2026, 8, 22),
                ExceptionType.BLOCKED,
                "Torneo",
                List.of(new IntervalDto(LocalTime.of(14, 0), LocalTime.of(17, 0)))
        );

        SportsFacility result = service.addException(request(), 10L, req);

        assertEquals(1, result.getExceptions().size());
        assertEquals(ExceptionType.BLOCKED, result.getExceptions().getFirst().getType());
    }

    @Test
    void shouldRejectBlockedExceptionWithoutIntervals() {
        SportsFacility sf = SportsFacility.builder().id(10L).clubId(1L).build();

        when(repository.findById(10L)).thenReturn(Optional.of(sf));
        when(clubFeignClient.getClub()).thenReturn(club(1L));

        ExceptionRequest req = new ExceptionRequest(
                LocalDate.of(2026, 8, 22), ExceptionType.BLOCKED, "Torneo", List.of());

        assertThrows(IllegalArgumentException.class,
                () -> service.addException(request(), 10L, req));
    }
}
