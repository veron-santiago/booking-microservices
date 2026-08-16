package com.sportsfacility_service.persistence;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ISportsFacilityRepository extends JpaRepository<SportsFacility, Long> {
    List<SportsFacility> findByClubId(Long id);
    long countByClubIdAndSportType(Long clubId, SportType sportType);
    List<SportsFacility> findByClubIdIn(List<Long> clubIds);
    List<SportsFacility> findByClubIdInAndSportTypeIn(List<Long> clubIds, List<SportType> sportTypes);
}
