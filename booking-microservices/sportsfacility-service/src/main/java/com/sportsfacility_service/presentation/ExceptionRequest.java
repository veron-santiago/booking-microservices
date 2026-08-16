package com.sportsfacility_service.presentation;

import com.sportsfacility_service.persistence.ExceptionType;

import java.time.LocalDate;
import java.util.List;

public record ExceptionRequest(
        LocalDate date,
        ExceptionType type,
        String note,
        List<IntervalDto> intervals
) {
}
