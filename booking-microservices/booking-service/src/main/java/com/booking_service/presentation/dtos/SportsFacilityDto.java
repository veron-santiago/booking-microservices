package com.booking_service.presentation.dtos;

import com.booking_service.presentation.SportType;
import lombok.Getter;
import lombok.Setter;

import java.util.ArrayList;
import java.util.List;

@Getter
@Setter
public class SportsFacilityDto {
    private Long id;
    private Long clubId;
    private String name;
    private SportType sportType;
    private List<OpeningHoursDto> openingHours = new ArrayList<>();
    private List<ScheduleExceptionDto> exceptions = new ArrayList<>();
}
