package com.booking_service.presentation;

import java.time.LocalDate;
import java.util.List;

public record SearchRequest(
        Double lat,
        Double lon,
        Double radius,
        List<SportType> sportTypes,
        LocalDate date
) {}
