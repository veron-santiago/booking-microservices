package com.booking_service.availability;

import java.time.LocalTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;

/**
 * Set-algebra helpers over lists of {@link TimeRange} within a single day.
 * All operations return a normalized (sorted, merged, no invalid/empty) result.
 */
public final class TimeRanges {

    private TimeRanges() {
    }

    /** Sorts by start and merges overlapping/adjacent ranges. Drops invalid ranges. */
    public static List<TimeRange> normalize(List<TimeRange> ranges) {
        if (ranges == null || ranges.isEmpty()) {
            return new ArrayList<>();
        }

        List<TimeRange> valid = ranges.stream()
                .filter(r -> r != null && r.isValid())
                .sorted(Comparator.comparing(TimeRange::start))
                .toList();

        List<TimeRange> merged = new ArrayList<>();
        for (TimeRange current : valid) {
            if (merged.isEmpty()) {
                merged.add(current);
                continue;
            }
            TimeRange last = merged.get(merged.size() - 1);
            if (!current.start().isAfter(last.end())) {
                LocalTime newEnd = current.end().isAfter(last.end()) ? current.end() : last.end();
                merged.set(merged.size() - 1, new TimeRange(last.start(), newEnd));
            } else {
                merged.add(current);
            }
        }
        return merged;
    }

    /** Intersection of two range sets. */
    public static List<TimeRange> intersect(List<TimeRange> a, List<TimeRange> b) {
        List<TimeRange> left = normalize(a);
        List<TimeRange> right = normalize(b);
        List<TimeRange> result = new ArrayList<>();

        for (TimeRange x : left) {
            for (TimeRange y : right) {
                LocalTime start = x.start().isAfter(y.start()) ? x.start() : y.start();
                LocalTime end = x.end().isBefore(y.end()) ? x.end() : y.end();
                if (start.isBefore(end)) {
                    result.add(new TimeRange(start, end));
                }
            }
        }
        return normalize(result);
    }

    /** Removes the {@code remove} ranges from {@code base}. */
    public static List<TimeRange> subtract(List<TimeRange> base, List<TimeRange> remove) {
        List<TimeRange> current = normalize(base);
        List<TimeRange> cuts = normalize(remove);

        for (TimeRange cut : cuts) {
            List<TimeRange> next = new ArrayList<>();
            for (TimeRange r : current) {
                if (cut.end().compareTo(r.start()) <= 0 || cut.start().compareTo(r.end()) >= 0) {
                    // no overlap
                    next.add(r);
                    continue;
                }
                if (r.start().isBefore(cut.start())) {
                    next.add(new TimeRange(r.start(), cut.start()));
                }
                if (cut.end().isBefore(r.end())) {
                    next.add(new TimeRange(cut.end(), r.end()));
                }
            }
            current = next;
        }
        return normalize(current);
    }

    /** True if [from, to] is fully contained within a single range of {@code ranges}. */
    public static boolean contains(List<TimeRange> ranges, LocalTime from, LocalTime to) {
        if (from == null || to == null || !from.isBefore(to)) {
            return false;
        }
        for (TimeRange r : normalize(ranges)) {
            if (r.contains(from, to)) {
                return true;
            }
        }
        return false;
    }
}
