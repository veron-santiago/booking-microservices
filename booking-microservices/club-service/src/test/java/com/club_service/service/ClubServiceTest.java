package com.club_service.service;

import com.club_service.persistence.Club;
import com.club_service.persistence.ExceptionType;
import com.club_service.persistence.IClubRepository;
import com.club_service.presentation.ClubLocationRequest;
import com.club_service.presentation.CreateClubRequest;
import com.club_service.presentation.ExceptionRequest;
import com.club_service.presentation.IntervalDto;
import com.club_service.presentation.OpeningHoursDto;
import com.club_service.presentation.ScheduleRequest;
import com.club_service.util.JwtUtil;
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
class ClubServiceTest {

    @Mock
    private IClubRepository repository;

    @Mock
    private JwtUtil jwtUtil;

    @InjectMocks
    private ClubService service;

    @Test
    void shouldReturnClubById() {
        Club club = new Club();
        club.setId(1L);

        when(repository.findById(1L)).thenReturn(Optional.of(club));

        Club result = service.getClubById(1L);

        assertNotNull(result);
        assertEquals(1L, result.getId());
    }

    @Test
    void shouldReturnMyClub() {
        Club club = new Club();
        club.setId(10L);

        when(jwtUtil.extractUserId(any())).thenReturn(5L);
        when(repository.findByUserId(5L)).thenReturn(Optional.of(club));

        Club result = service.getMyClub(mock(HttpServletRequest.class));

        assertNotNull(result);
        assertEquals(10L, result.getId());
    }

    @Test
    void shouldGetClubsByLocation() {
        when(repository.findNearbyClubs(anyDouble(), anyDouble(), anyDouble()))
                .thenReturn(List.of(new Club()));

        List<Club> result = service.getClubsByLocation(-34.0, -58.0, 5);

        assertFalse(result.isEmpty());
    }

    @Test
    void shouldThrowInvalidLatitude() {
        assertThrows(IllegalArgumentException.class, () ->
                service.getClubsByLocation(-100, 0, 5)
        );
    }

    @Test
    void shouldUpdateLocation() {
        Club club = new Club();
        club.setId(1L);

        when(jwtUtil.extractUserId(any())).thenReturn(1L);
        when(repository.findByUserId(1L)).thenReturn(Optional.of(club));
        when(repository.save(any())).thenAnswer(i -> i.getArgument(0));

        ClubLocationRequest req = new ClubLocationRequest(-34.0, -58.0, "Dir");

        Club result = service.updateLocation(mock(HttpServletRequest.class), req);

        assertEquals(-34.0, result.getLatitude());
        assertEquals(-58.0, result.getLongitude());
        assertEquals("Dir", result.getAddress());
    }

    @Test
    void shouldCreateClubFromUser() {
        CreateClubRequest req = new CreateClubRequest(1L, "Club A");

        when(repository.save(any())).thenAnswer(i -> i.getArgument(0));

        Club result = service.createFromUser(req);

        assertEquals("Club A", result.getName());
        assertEquals(1L, result.getUserId());
    }

    @Test
    void shouldUpdateWeeklyScheduleWithMultipleIntervals() {
        Club club = new Club();
        club.setId(1L);

        when(jwtUtil.extractUserId(any())).thenReturn(1L);
        when(repository.findByUserId(1L)).thenReturn(Optional.of(club));
        when(repository.save(any())).thenAnswer(i -> i.getArgument(0));

        ScheduleRequest req = new ScheduleRequest(List.of(
                new OpeningHoursDto(DayOfWeek.MONDAY, LocalTime.of(8, 0), LocalTime.of(12, 0)),
                new OpeningHoursDto(DayOfWeek.MONDAY, LocalTime.of(14, 0), LocalTime.of(22, 0))
        ));

        Club result = service.updateSchedule(mock(HttpServletRequest.class), req);

        assertEquals(2, result.getOpeningHours().size());
        assertTrue(result.getOpeningHours().stream()
                .allMatch(h -> h.getDayOfWeek() == DayOfWeek.MONDAY));
    }

    @Test
    void shouldRejectOverlappingIntervalsSameDay() {
        Club club = new Club();
        when(jwtUtil.extractUserId(any())).thenReturn(1L);
        when(repository.findByUserId(1L)).thenReturn(Optional.of(club));

        ScheduleRequest req = new ScheduleRequest(List.of(
                new OpeningHoursDto(DayOfWeek.MONDAY, LocalTime.of(8, 0), LocalTime.of(12, 0)),
                new OpeningHoursDto(DayOfWeek.MONDAY, LocalTime.of(11, 0), LocalTime.of(15, 0))
        ));

        assertThrows(IllegalArgumentException.class,
                () -> service.updateSchedule(mock(HttpServletRequest.class), req));
    }

    @Test
    void shouldRejectStartAfterEnd() {
        Club club = new Club();
        when(jwtUtil.extractUserId(any())).thenReturn(1L);
        when(repository.findByUserId(1L)).thenReturn(Optional.of(club));

        ScheduleRequest req = new ScheduleRequest(List.of(
                new OpeningHoursDto(DayOfWeek.TUESDAY, LocalTime.of(20, 0), LocalTime.of(10, 0))
        ));

        assertThrows(IllegalArgumentException.class,
                () -> service.updateSchedule(mock(HttpServletRequest.class), req));
    }

    @Test
    void shouldAddCustomHoursException() {
        Club club = new Club();
        when(jwtUtil.extractUserId(any())).thenReturn(1L);
        when(repository.findByUserId(1L)).thenReturn(Optional.of(club));
        when(repository.save(any())).thenAnswer(i -> i.getArgument(0));

        ExceptionRequest req = new ExceptionRequest(
                LocalDate.of(2026, 8, 20),
                ExceptionType.CUSTOM_HOURS,
                "Horario reducido",
                List.of(new IntervalDto(LocalTime.of(10, 0), LocalTime.of(18, 0)))
        );

        Club result = service.addException(mock(HttpServletRequest.class), req);

        assertEquals(1, result.getExceptions().size());
        assertEquals(ExceptionType.CUSTOM_HOURS, result.getExceptions().getFirst().getType());
        assertEquals(1, result.getExceptions().getFirst().getIntervals().size());
    }

    @Test
    void shouldRejectCustomHoursExceptionWithoutIntervals() {
        Club club = new Club();
        when(jwtUtil.extractUserId(any())).thenReturn(1L);
        when(repository.findByUserId(1L)).thenReturn(Optional.of(club));

        ExceptionRequest req = new ExceptionRequest(
                LocalDate.of(2026, 8, 20),
                ExceptionType.CUSTOM_HOURS,
                null,
                List.of()
        );

        assertThrows(IllegalArgumentException.class,
                () -> service.addException(mock(HttpServletRequest.class), req));
    }

    @Test
    void shouldReplaceExistingExceptionForSameDate() {
        Club club = new Club();
        when(jwtUtil.extractUserId(any())).thenReturn(1L);
        when(repository.findByUserId(1L)).thenReturn(Optional.of(club));
        when(repository.save(any())).thenAnswer(i -> i.getArgument(0));

        LocalDate date = LocalDate.of(2026, 8, 15);
        service.addException(mock(HttpServletRequest.class),
                new ExceptionRequest(date, ExceptionType.CLOSED, "Feriado", null));
        Club result = service.addException(mock(HttpServletRequest.class),
                new ExceptionRequest(date, ExceptionType.CUSTOM_HOURS, null,
                        List.of(new IntervalDto(LocalTime.of(9, 0), LocalTime.of(13, 0)))));

        assertEquals(1, result.getExceptions().size());
        assertEquals(ExceptionType.CUSTOM_HOURS, result.getExceptions().getFirst().getType());
    }
}
