package com.club_service.presentation;

import java.time.DayOfWeek;
import java.time.LocalTime;

public record OpeningHoursDto(DayOfWeek dayOfWeek, LocalTime startTime, LocalTime endTime) {
}
