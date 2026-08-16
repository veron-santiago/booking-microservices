package com.booking_service.presentation;

import java.time.LocalDateTime;

public record BookingRequest(
        Long sportsFacilityId,
        LocalDateTime start,
        Integer durationMinutes
) {}