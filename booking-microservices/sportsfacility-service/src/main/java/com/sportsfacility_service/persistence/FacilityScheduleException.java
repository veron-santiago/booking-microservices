package com.sportsfacility_service.persistence;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

/**
 * A date-specific override of the facility's weekly schedule.
 * CLOSED       -> the facility is closed that date.
 * CUSTOM_HOURS -> the facility uses {@link #intervals} that date.
 * BLOCKED      -> {@link #intervals} are removed from the normal availability that date
 *                 (e.g. a tournament or maintenance window).
 */
@Entity
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FacilityScheduleException {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private LocalDate date;

    @Enumerated(EnumType.STRING)
    private ExceptionType type;

    private String note;

    @ElementCollection
    @CollectionTable(
            name = "facility_exception_intervals",
            joinColumns = @JoinColumn(name = "exception_id")
    )
    @Builder.Default
    private List<TimeInterval> intervals = new ArrayList<>();
}
