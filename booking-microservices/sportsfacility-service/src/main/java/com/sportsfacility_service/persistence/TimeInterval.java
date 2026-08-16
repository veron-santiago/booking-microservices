package com.sportsfacility_service.persistence;

import jakarta.persistence.Embeddable;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalTime;

/**
 * A single [startTime, endTime) time range within a day.
 * Field names avoid the SQL reserved words "start"/"end".
 */
@Embeddable
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class TimeInterval {
    private LocalTime startTime;
    private LocalTime endTime;
}
