package com.booking_service.availability;

import com.booking_service.presentation.dtos.ClubDto;
import com.booking_service.presentation.dtos.ExceptionType;
import com.booking_service.presentation.dtos.IntervalDto;
import com.booking_service.presentation.dtos.OpeningHoursDto;
import com.booking_service.presentation.dtos.ScheduleExceptionDto;
import com.booking_service.presentation.dtos.SportsFacilityDto;
import org.junit.jupiter.api.Test;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

class AvailabilityServiceTest {

    private final AvailabilityService service = new AvailabilityService();

    private final LocalDate date = LocalDate.of(2026, 8, 17);
    private final DayOfWeek day = date.getDayOfWeek();

    private LocalTime t(int h) {
        return LocalTime.of(h, 0);
    }

    private OpeningHoursDto oh(int fromH, int toH) {
        return new OpeningHoursDto(day, t(fromH), t(toH));
    }

    private ClubDto club(OpeningHoursDto... hours) {
        ClubDto c = new ClubDto();
        c.setId(1L);
        List<OpeningHoursDto> list = new ArrayList<>(List.of(hours));
        c.setOpeningHours(list);
        return c;
    }

    private SportsFacilityDto facility(OpeningHoursDto... hours) {
        SportsFacilityDto f = new SportsFacilityDto();
        f.setId(10L);
        f.setClubId(1L);
        f.setOpeningHours(new ArrayList<>(List.of(hours)));
        return f;
    }

    private ScheduleExceptionDto exception(ExceptionType type, IntervalDto... intervals) {
        ScheduleExceptionDto e = new ScheduleExceptionDto();
        e.setDate(date);
        e.setType(type);
        e.setIntervals(new ArrayList<>(List.of(intervals)));
        return e;
    }

    private IntervalDto interval(int fromH, int toH) {
        return new IntervalDto(t(fromH), t(toH));
    }

    private void assertRanges(List<TimeRange> ranges, int... bounds) {
        assertEquals(bounds.length / 2, ranges.size(), "range count");
        for (int i = 0; i < ranges.size(); i++) {
            assertEquals(t(bounds[i * 2]), ranges.get(i).start());
            assertEquals(t(bounds[i * 2 + 1]), ranges.get(i).end());
        }
    }

    @Test
    void case1_intersectionMultipleIntervals() {
        List<TimeRange> result = service.effectiveAvailability(
                club(oh(8, 12), oh(14, 20)), facility(oh(10, 18)), date);
        assertRanges(result, 10, 12, 14, 18);
    }

    @Test
    void case2_clubClosedThatDay() {
        // Club has no interval that day; facility 08-20.
        List<TimeRange> result = service.effectiveAvailability(
                club(), facility(oh(8, 20)), date);
        assertTrue(result.isEmpty());
    }

    @Test
    void case3_facilityBlockedPeriod() {
        SportsFacilityDto f = facility(oh(8, 20));
        f.setExceptions(List.of(exception(ExceptionType.BLOCKED, interval(14, 17))));
        List<TimeRange> result = service.effectiveAvailability(club(oh(8, 20)), f, date);
        assertRanges(result, 8, 14, 17, 20);
    }

    @Test
    void case4_clubClosedByException() {
        ClubDto c = club(oh(8, 20));
        c.setExceptions(List.of(exception(ExceptionType.CLOSED)));
        List<TimeRange> result = service.effectiveAvailability(c, facility(oh(8, 20)), date);
        assertTrue(result.isEmpty());
    }

    @Test
    void case5_clubCustomHoursException() {
        ClubDto c = club(oh(8, 20));
        c.setExceptions(List.of(exception(ExceptionType.CUSTOM_HOURS, interval(10, 18))));
        List<TimeRange> result = service.effectiveAvailability(c, facility(oh(8, 20)), date);
        assertRanges(result, 10, 18);
    }

    @Test
    void facilityWithNoScheduleFollowsClub() {
        List<TimeRange> result = service.effectiveAvailability(
                club(oh(8, 12), oh(14, 20)), facility(), date);
        assertRanges(result, 8, 12, 14, 20);
    }

    @Test
    void facilityClosedByExceptionIsClosed() {
        SportsFacilityDto f = facility(oh(8, 20));
        f.setExceptions(List.of(exception(ExceptionType.CLOSED)));
        List<TimeRange> result = service.effectiveAvailability(club(oh(8, 20)), f, date);
        assertTrue(result.isEmpty());
    }

    @Test
    void facilityCustomHoursClampedToClub() {
        // Facility custom 06-23 but club only 08-20 -> clamped to 08-20.
        SportsFacilityDto f = facility(oh(10, 18));
        f.setExceptions(List.of(exception(ExceptionType.CUSTOM_HOURS, interval(6, 23))));
        List<TimeRange> result = service.effectiveAvailability(club(oh(8, 20)), f, date);
        assertRanges(result, 8, 20);
    }

    @Test
    void freeAvailabilityRemovesBookings() {
        List<TimeRange> booked = List.of(new TimeRange(t(10), t(11)));
        List<TimeRange> result = service.freeAvailability(
                club(oh(8, 20)), facility(), date, booked);
        assertRanges(result, 8, 10, 11, 20);
    }
}
