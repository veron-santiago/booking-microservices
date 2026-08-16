package com.booking_service.availability;

import java.time.LocalTime;

/**
 * A half-open [start, end) time range within a single day.
 */
public record TimeRange(LocalTime start, LocalTime end) {

    public TimeRange {
        if (start == null || end == null) {
            throw new IllegalArgumentException("TimeRange bounds must not be null");
        }
    }

    public boolean isValid() {
        return start.isBefore(end);
    }

    /** True if this range fully contains [from, to]. */
    public boolean contains(LocalTime from, LocalTime to) {
        return !from.isBefore(start) && !to.isAfter(end);
    }
}
