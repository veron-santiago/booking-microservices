package com.booking_service.presentation;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@AllArgsConstructor
public class SearchResponse {
    private Long facilityId;
    private String facilityName;
    private SportType sportType;
    private Long clubId;
    private String clubName;
    private String address;
    private boolean available;
}
