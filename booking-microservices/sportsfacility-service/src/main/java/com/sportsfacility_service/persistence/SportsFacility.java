package com.sportsfacility_service.persistence;

import jakarta.persistence.*;
import lombok.*;

import java.util.ArrayList;
import java.util.List;

@Entity
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SportsFacility {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private Long clubId;
    private String name;
    @Enumerated(EnumType.STRING)
    private SportType sportType;

    @OneToMany(cascade = CascadeType.ALL, orphanRemoval = true)
    @JoinColumn(name = "facility_id")
    @Builder.Default
    private List<FacilityOpeningHours> openingHours = new ArrayList<>();

    @OneToMany(cascade = CascadeType.ALL, orphanRemoval = true)
    @JoinColumn(name = "facility_id")
    @Builder.Default
    private List<FacilityScheduleException> exceptions = new ArrayList<>();
}
