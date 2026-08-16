package com.booking_service.service;

import com.booking_service.availability.AvailabilityService;
import com.booking_service.configuration.feignclients.ClubFeignClient;
import com.booking_service.configuration.feignclients.SportsFacilityFeignClient;
import com.booking_service.persistence.Booking;
import com.booking_service.persistence.IBookingRepository;
import com.booking_service.presentation.BookingRequest;
import com.booking_service.presentation.dtos.ClubDto;
import com.booking_service.presentation.dtos.ExceptionType;
import com.booking_service.presentation.dtos.IntervalDto;
import com.booking_service.presentation.dtos.OpeningHoursDto;
import com.booking_service.presentation.dtos.ScheduleExceptionDto;
import com.booking_service.presentation.dtos.SportsFacilityDto;
import com.booking_service.util.JwtUtil;
import jakarta.servlet.http.HttpServletRequest;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyList;
import static org.mockito.Mockito.*;

class BookingServiceTest {

    private IBookingRepository repository;
    private ClubFeignClient clubFeignClient;
    private SportsFacilityFeignClient facilityFeignClient;
    private JwtUtil jwtUtil;
    private BookingService service;

    private final LocalDate date = LocalDate.now().plusDays(1);

    @BeforeEach
    void setUp() {
        repository = mock(IBookingRepository.class);
        clubFeignClient = mock(ClubFeignClient.class);
        facilityFeignClient = mock(SportsFacilityFeignClient.class);
        jwtUtil = mock(JwtUtil.class);
        service = new BookingService(repository, clubFeignClient, facilityFeignClient,
                new AvailabilityService(), jwtUtil);
    }

    private HttpServletRequest request() {
        return mock(HttpServletRequest.class);
    }

    private LocalDateTime at(int hour, int minute) {
        return date.atTime(hour, minute);
    }

    private OpeningHoursDto oh(DayOfWeek day, int fromH, int toH) {
        return new OpeningHoursDto(day, LocalTime.of(fromH, 0), LocalTime.of(toH, 0));
    }

    /** Club open with the given hour intervals every day of the week. */
    private ClubDto clubOpenDaily(int[]... intervals) {
        ClubDto club = new ClubDto();
        club.setId(1L);
        club.setName("Club A");
        List<OpeningHoursDto> hours = new ArrayList<>();
        for (DayOfWeek day : DayOfWeek.values()) {
            for (int[] i : intervals) {
                hours.add(oh(day, i[0], i[1]));
            }
        }
        club.setOpeningHours(hours);
        return club;
    }

    private SportsFacilityDto facilityFollowingClub() {
        SportsFacilityDto f = new SportsFacilityDto();
        f.setId(10L);
        f.setClubId(1L);
        f.setName("Field 1");
        return f;
    }

    private SportsFacilityDto facilityOpenDaily(int[]... intervals) {
        SportsFacilityDto f = facilityFollowingClub();
        List<OpeningHoursDto> hours = new ArrayList<>();
        for (DayOfWeek day : DayOfWeek.values()) {
            for (int[] i : intervals) {
                hours.add(oh(day, i[0], i[1]));
            }
        }
        f.setOpeningHours(hours);
        return f;
    }

    @Test
    void shouldReturnMyBookings() {
        when(jwtUtil.extractUserId(any())).thenReturn(1L);
        when(repository.findByUserId(1L)).thenReturn(List.of(new Booking()));

        List<Booking> result = service.getMyBookings(request());

        assertFalse(result.isEmpty());
    }

    @Test
    void shouldCreateBooking() {
        when(jwtUtil.extractUserId(any())).thenReturn(1L);
        when(facilityFeignClient.getSportsFacilityById(10L)).thenReturn(facilityFollowingClub());
        when(clubFeignClient.getClubById(1L)).thenReturn(clubOpenDaily(new int[]{8, 22}));
        when(repository.findBySportsFacilityId(10L)).thenReturn(List.of());
        when(repository.save(any())).thenAnswer(i -> i.getArgument(0));

        BookingRequest req = new BookingRequest(10L, at(10, 0), 60);
        Booking result = service.createBooking(request(), req);

        assertNotNull(result);
        assertEquals(1L, result.getUserId());
    }

    @Test
    void shouldThrowWhenInvalidDuration() {
        when(jwtUtil.extractUserId(any())).thenReturn(1L);

        BookingRequest req = new BookingRequest(10L, at(10, 0), 0);

        assertThrows(IllegalArgumentException.class,
                () -> service.createBooking(request(), req));
    }

    @Test
    void shouldThrowWhenBookingInPast() {
        when(jwtUtil.extractUserId(any())).thenReturn(1L);

        BookingRequest req = new BookingRequest(10L, LocalDateTime.now().minusHours(1), 60);

        assertThrows(IllegalArgumentException.class,
                () -> service.createBooking(request(), req));
    }

    @Test
    void shouldThrowWhenConflict() {
        when(jwtUtil.extractUserId(any())).thenReturn(1L);
        when(facilityFeignClient.getSportsFacilityById(10L)).thenReturn(facilityFollowingClub());
        when(clubFeignClient.getClubById(1L)).thenReturn(clubOpenDaily(new int[]{8, 22}));

        Booking existing = Booking.builder()
                .sportsFacilityId(10L)
                .start(at(10, 30))
                .end(at(11, 30))
                .build();
        when(repository.findBySportsFacilityId(10L)).thenReturn(List.of(existing));

        BookingRequest req = new BookingRequest(10L, at(10, 0), 60);

        assertThrows(RuntimeException.class,
                () -> service.createBooking(request(), req));
    }

    @Test
    void shouldRejectBookingCrossingClosedPeriod() {
        // Club open 08-12 / 14-20 -> effective has a gap 12-14.
        when(jwtUtil.extractUserId(any())).thenReturn(1L);
        when(facilityFeignClient.getSportsFacilityById(10L)).thenReturn(facilityFollowingClub());
        when(clubFeignClient.getClubById(1L))
                .thenReturn(clubOpenDaily(new int[]{8, 12}, new int[]{14, 20}));

        BookingRequest req = new BookingRequest(10L, at(11, 0), 120); // 11:00-13:00

        assertThrows(IllegalArgumentException.class,
                () -> service.createBooking(request(), req));
    }

    @Test
    void shouldAcceptBookingWithinFacilityHours() {
        // Club 08-20, facility 10-18 -> booking 11-12 is valid.
        when(jwtUtil.extractUserId(any())).thenReturn(1L);
        when(facilityFeignClient.getSportsFacilityById(10L))
                .thenReturn(facilityOpenDaily(new int[]{10, 18}));
        when(clubFeignClient.getClubById(1L)).thenReturn(clubOpenDaily(new int[]{8, 20}));
        when(repository.findBySportsFacilityId(10L)).thenReturn(List.of());
        when(repository.save(any())).thenAnswer(i -> i.getArgument(0));

        BookingRequest req = new BookingRequest(10L, at(11, 0), 60);
        Booking result = service.createBooking(request(), req);

        assertNotNull(result);
    }

    @Test
    void shouldRejectBookingOutsideFacilityHours() {
        // Club 08-20, facility 10-18 -> booking 08-09 is outside the facility window.
        when(jwtUtil.extractUserId(any())).thenReturn(1L);
        when(facilityFeignClient.getSportsFacilityById(10L))
                .thenReturn(facilityOpenDaily(new int[]{10, 18}));
        when(clubFeignClient.getClubById(1L)).thenReturn(clubOpenDaily(new int[]{8, 20}));

        BookingRequest req = new BookingRequest(10L, at(8, 0), 60);

        assertThrows(IllegalArgumentException.class,
                () -> service.createBooking(request(), req));
    }

    @Test
    void shouldRejectWhenClubClosedByException() {
        ClubDto club = clubOpenDaily(new int[]{8, 20});
        ScheduleExceptionDto closed = new ScheduleExceptionDto();
        closed.setDate(date);
        closed.setType(ExceptionType.CLOSED);
        club.setExceptions(List.of(closed));

        when(jwtUtil.extractUserId(any())).thenReturn(1L);
        when(facilityFeignClient.getSportsFacilityById(10L)).thenReturn(facilityFollowingClub());
        when(clubFeignClient.getClubById(1L)).thenReturn(club);

        BookingRequest req = new BookingRequest(10L, at(10, 0), 60);

        assertThrows(IllegalArgumentException.class,
                () -> service.createBooking(request(), req));
    }

    @Test
    void shouldReturnAvailabilityMinusBookings() {
        when(facilityFeignClient.getSportsFacilityById(10L)).thenReturn(facilityFollowingClub());
        when(clubFeignClient.getClubById(1L)).thenReturn(clubOpenDaily(new int[]{8, 20}));

        Booking existing = Booking.builder()
                .sportsFacilityId(10L)
                .start(at(10, 0))
                .end(at(11, 0))
                .build();
        when(repository.findBookingsOverlappingDay(anyList(), any(), any()))
                .thenReturn(List.of(existing));

        List<IntervalDto> result = service.getAvailability(10L, date);

        // 08-20 minus 10-11 -> [08-10, 11-20]
        assertEquals(2, result.size());
        assertEquals(LocalTime.of(8, 0), result.get(0).getStartTime());
        assertEquals(LocalTime.of(10, 0), result.get(0).getEndTime());
        assertEquals(LocalTime.of(11, 0), result.get(1).getStartTime());
        assertEquals(LocalTime.of(20, 0), result.get(1).getEndTime());
    }

    @Test
    void shouldDeleteBooking() {
        Booking booking = Booking.builder().id(1L).userId(1L).build();
        when(jwtUtil.extractUserId(any())).thenReturn(1L);
        when(repository.findById(1L)).thenReturn(Optional.of(booking));

        service.deleteBooking(request(), 1L);

        verify(repository).delete(booking);
    }

    @Test
    void shouldThrowWhenDeletingOtherUsersBooking() {
        Booking booking = Booking.builder().id(1L).userId(2L).build();
        when(jwtUtil.extractUserId(any())).thenReturn(1L);
        when(repository.findById(1L)).thenReturn(Optional.of(booking));

        assertThrows(RuntimeException.class,
                () -> service.deleteBooking(request(), 1L));
    }
}
