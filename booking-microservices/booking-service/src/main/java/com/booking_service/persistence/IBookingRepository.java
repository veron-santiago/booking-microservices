package com.booking_service.persistence;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

@Repository
public interface IBookingRepository extends JpaRepository<Booking, Long> {
    List<Booking> findByUserId(Long userId);
    List<Booking> findBySportsFacilityId(Long sportsFacilityId);
    List<Booking> findBySportsFacilityIdIn(List<Long> sportsFacilityIds);

    @Query("""
    SELECT b FROM Booking b
    WHERE b.sportsFacilityId IN :facilityIds
      AND b.start < :endOfDay
      AND b.end > :startOfDay
    """)
    List<Booking> findBookingsOverlappingDay(
            List<Long> facilityIds,
            LocalDateTime startOfDay,
            LocalDateTime endOfDay
    );
}
