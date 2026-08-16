package com.sportsfacility_service.presentation;

import com.sportsfacility_service.persistence.SportType;

import java.util.List;

public record SearchRequest(List<Long> clubIds, List<SportType> sportTypes) {
}
