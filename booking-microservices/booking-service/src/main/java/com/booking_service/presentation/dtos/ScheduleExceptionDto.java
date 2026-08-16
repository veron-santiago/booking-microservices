package com.booking_service.presentation.dtos;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
public class ScheduleExceptionDto {
    private Long id;
    private LocalDate date;
    private ExceptionType type;
    private String note;
    private List<IntervalDto> intervals = new ArrayList<>();
}
