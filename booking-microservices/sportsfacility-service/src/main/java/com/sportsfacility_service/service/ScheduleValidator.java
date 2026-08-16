package com.sportsfacility_service.service;

import com.sportsfacility_service.persistence.TimeInterval;

import java.time.LocalTime;
import java.util.Comparator;
import java.util.List;

/**
 * Validates that a set of intervals belonging to the same day is well formed:
 * every interval has start &lt; end and no two intervals overlap.
 */
public final class ScheduleValidator {

    private ScheduleValidator() {
    }

    public static void validateSameDayIntervals(List<TimeInterval> intervals) {
        if (intervals == null || intervals.isEmpty()) {
            return;
        }

        for (TimeInterval interval : intervals) {
            if (interval.getStartTime() == null || interval.getEndTime() == null) {
                throw new IllegalArgumentException("Cada intervalo debe tener hora de inicio y fin");
            }
            if (!interval.getStartTime().isBefore(interval.getEndTime())) {
                throw new IllegalArgumentException("La hora de inicio debe ser anterior a la hora de fin");
            }
        }

        List<TimeInterval> sorted = intervals.stream()
                .sorted(Comparator.comparing(TimeInterval::getStartTime))
                .toList();

        for (int i = 1; i < sorted.size(); i++) {
            LocalTime previousEnd = sorted.get(i - 1).getEndTime();
            LocalTime currentStart = sorted.get(i).getStartTime();
            if (currentStart.isBefore(previousEnd)) {
                throw new IllegalArgumentException("Los intervalos no pueden solaparse dentro del mismo día");
            }
        }
    }
}
