package com.club_service.presentation;

import java.util.List;

/** Full replacement of the club's weekly opening hours. */
public record ScheduleRequest(List<OpeningHoursDto> openingHours) {
}
