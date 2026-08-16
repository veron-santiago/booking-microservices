package com.booking_service.presentation.dtos;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class IntervalDto {
    private LocalTime startTime;
    private LocalTime endTime;
}
