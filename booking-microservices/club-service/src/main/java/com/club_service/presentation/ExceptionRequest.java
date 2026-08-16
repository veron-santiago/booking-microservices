package com.club_service.presentation;

import com.club_service.persistence.ExceptionType;

import java.time.LocalDate;
import java.util.List;

public record ExceptionRequest(
        LocalDate date,
        ExceptionType type,
        String note,
        List<IntervalDto> intervals
) {
}
