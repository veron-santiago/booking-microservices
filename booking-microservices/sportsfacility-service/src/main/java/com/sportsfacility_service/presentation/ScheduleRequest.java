package com.sportsfacility_service.presentation;

import java.util.List;

/** Full replacement of the facility's weekly availability. */
public record ScheduleRequest(List<OpeningHoursDto> openingHours) {
}
