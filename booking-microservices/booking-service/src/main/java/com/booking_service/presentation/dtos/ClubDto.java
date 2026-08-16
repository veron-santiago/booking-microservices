package com.booking_service.presentation.dtos;

import lombok.Getter;
import lombok.Setter;

import java.util.ArrayList;
import java.util.List;

@Getter
@Setter
public class ClubDto {
    private Long id;
    private String name;
    private String address;
    private Double latitude;
    private Double longitude;
    private List<OpeningHoursDto> openingHours = new ArrayList<>();
    private List<ScheduleExceptionDto> exceptions = new ArrayList<>();
}
