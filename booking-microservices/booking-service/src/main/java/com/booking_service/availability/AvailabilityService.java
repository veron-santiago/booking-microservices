package com.booking_service.availability;

import com.booking_service.presentation.dtos.ClubDto;
import com.booking_service.presentation.dtos.ExceptionType;
import com.booking_service.presentation.dtos.OpeningHoursDto;
import com.booking_service.presentation.dtos.ScheduleExceptionDto;
import com.booking_service.presentation.dtos.SportsFacilityDto;
import org.springframework.stereotype.Service;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

/**
 * Computes the effective availability of a facility on a given date by combining:
 *   1. the club's weekly schedule (or its date exception),
 *   2. the facility's weekly schedule (or its date exception),
 *   3. intersecting facility ∩ club, and
 *   4. removing any facility BLOCKED periods.
 *
 * A facility can never be available while the club is closed.
 */
@Service
public class AvailabilityService {

    /** Effective open ranges for the facility on {@code date}, before removing bookings. */
    public List<TimeRange> effectiveAvailability(ClubDto club, SportsFacilityDto facility, LocalDate date) {
        List<TimeRange> clubRanges = resolveClubRanges(club, date);
        if (clubRanges.isEmpty()) {
            return List.of();
        }

        FacilityResolution facility_ = resolveFacilityRanges(facility, date);

        // null ranges => facility imposes no restriction, follow the club.
        List<TimeRange> base = (facility_.ranges == null)
                ? clubRanges
                : TimeRanges.intersect(clubRanges, facility_.ranges);

        if (facility_.blocked != null && !facility_.blocked.isEmpty()) {
            base = TimeRanges.subtract(base, facility_.blocked);
        }

        return TimeRanges.normalize(base);
    }

    /** Effective ranges minus the given already-booked ranges. */
    public List<TimeRange> freeAvailability(ClubDto club, SportsFacilityDto facility, LocalDate date,
                                            List<TimeRange> booked) {
        return TimeRanges.subtract(effectiveAvailability(club, facility, date), booked);
    }

    private List<TimeRange> resolveClubRanges(ClubDto club, LocalDate date) {
        if (club == null) {
            return List.of();
        }
        ScheduleExceptionDto exception = findException(club.getExceptions(), date);
        if (exception != null) {
            if (exception.getType() == ExceptionType.CLOSED) {
                return List.of();
            }
            // CUSTOM_HOURS (BLOCKED is not a club-level concept).
            return TimeRanges.normalize(toRanges(exception.getIntervals()));
        }
        return TimeRanges.normalize(weeklyRanges(club.getOpeningHours(), date.getDayOfWeek()));
    }

    private FacilityResolution resolveFacilityRanges(SportsFacilityDto facility, LocalDate date) {
        if (facility == null) {
            return new FacilityResolution(null, null);
        }

        ScheduleExceptionDto exception = findException(facility.getExceptions(), date);
        if (exception != null) {
            switch (exception.getType()) {
                case CLOSED:
                    // Explicitly closed that date.
                    return new FacilityResolution(List.of(), null);
                case CUSTOM_HOURS:
                    return new FacilityResolution(
                            TimeRanges.normalize(toRanges(exception.getIntervals())), null);
                case BLOCKED:
                    return new FacilityResolution(
                            weeklyRangesOrNull(facility, date),
                            TimeRanges.normalize(toRanges(exception.getIntervals())));
                default:
                    break;
            }
        }
        return new FacilityResolution(weeklyRangesOrNull(facility, date), null);
    }

    /** Null means "no facility-level schedule configured" (follow the club). */
    private List<TimeRange> weeklyRangesOrNull(SportsFacilityDto facility, LocalDate date) {
        List<OpeningHoursDto> hours = facility.getOpeningHours();
        if (hours == null || hours.isEmpty()) {
            return null;
        }
        return TimeRanges.normalize(weeklyRanges(hours, date.getDayOfWeek()));
    }

    private List<TimeRange> weeklyRanges(List<OpeningHoursDto> hours, DayOfWeek day) {
        List<TimeRange> ranges = new ArrayList<>();
        if (hours == null) {
            return ranges;
        }
        for (OpeningHoursDto h : hours) {
            if (h.getDayOfWeek() == day && h.getStartTime() != null && h.getEndTime() != null) {
                ranges.add(new TimeRange(h.getStartTime(), h.getEndTime()));
            }
        }
        return ranges;
    }

    private List<TimeRange> toRanges(List<com.booking_service.presentation.dtos.IntervalDto> intervals) {
        List<TimeRange> ranges = new ArrayList<>();
        if (intervals == null) {
            return ranges;
        }
        intervals.stream()
                .filter(i -> i.getStartTime() != null && i.getEndTime() != null)
                .forEach(i -> ranges.add(new TimeRange(i.getStartTime(), i.getEndTime())));
        return ranges;
    }

    private ScheduleExceptionDto findException(List<ScheduleExceptionDto> exceptions, LocalDate date) {
        if (exceptions == null) {
            return null;
        }
        return exceptions.stream()
                .filter(e -> date.equals(e.getDate()))
                .findFirst()
                .orElse(null);
    }

    /** ranges == null means "no restriction"; ranges == [] means "closed". */
    private record FacilityResolution(List<TimeRange> ranges, List<TimeRange> blocked) {
    }
}
