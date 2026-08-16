package com.club_service.persistence;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface IClubRepository extends JpaRepository<Club, Long> {

    Optional<Club> findByUserId(Long userId);
    @Query("""
    SELECT c FROM Club c
    WHERE 
    (6371 * acos(
    cos(radians(:lat)) *
    cos(radians(c.latitude)) *
    cos(radians(c.longitude) - radians(:lon)) +
    sin(radians(:lat)) *
    sin(radians(c.latitude))
    )) < :radius
    """)
    List<Club> findNearbyClubs(double lat, double lon, double radius);

}
