package com.booking_service.presentation;

import java.util.List;

public record SearchFacilitiesRequest(List<Long> clubIds, List<SportType> sportTypes) {
}
