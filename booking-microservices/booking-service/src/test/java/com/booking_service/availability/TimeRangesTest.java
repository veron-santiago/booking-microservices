package com.booking_service.availability;

import org.junit.jupiter.api.Test;

import java.time.LocalTime;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

class TimeRangesTest {

    private LocalTime t(int h) {
        return LocalTime.of(h, 0);
    }

    private TimeRange r(int from, int to) {
        return new TimeRange(t(from), t(to));
    }

    @Test
    void normalizeMergesOverlappingAndAdjacent() {
        List<TimeRange> result = TimeRanges.normalize(List.of(r(8, 10), r(10, 12), r(11, 13)));
        assertEquals(1, result.size());
        assertEquals(r(8, 13), result.getFirst());
    }

    @Test
    void intersectComputesOverlap() {
        List<TimeRange> result = TimeRanges.intersect(List.of(r(8, 12), r(14, 20)), List.of(r(10, 18)));
        assertEquals(List.of(r(10, 12), r(14, 18)), result);
    }

    @Test
    void subtractRemovesInnerRange() {
        List<TimeRange> result = TimeRanges.subtract(List.of(r(8, 20)), List.of(r(14, 17)));
        assertEquals(List.of(r(8, 14), r(17, 20)), result);
    }

    @Test
    void containsRequiresSingleRange() {
        List<TimeRange> ranges = List.of(r(8, 12), r(14, 20));
        assertTrue(TimeRanges.contains(ranges, t(10), t(12)));
        assertFalse(TimeRanges.contains(ranges, t(11), t(15))); // crosses the gap
        assertFalse(TimeRanges.contains(ranges, t(12), t(12))); // zero-length
    }
}
