package com.booking_service.presentation;

import com.booking_service.persistence.Booking;
import com.booking_service.presentation.dtos.IntervalDto;
import com.booking_service.service.BookingService;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/booking")
public class BookingController {

    private final BookingService bookingService;

    public BookingController(BookingService bookingService) {
        this.bookingService = bookingService;
    }

    @GetMapping("/user")
    public ResponseEntity<List<Booking>> getMyBookings(HttpServletRequest request) {
        List<Booking> bookings = bookingService.getMyBookings(request);
        if (bookings == null || bookings.isEmpty()) return ResponseEntity.noContent().build();
        return ResponseEntity.ok(bookings);
    }

    @GetMapping("/club")
    public ResponseEntity<List<Booking>> getMyClubBookings(HttpServletRequest request){
        List<Booking> bookings = bookingService.getMyClubBookings(request);
        if (bookings == null || bookings.isEmpty()) return ResponseEntity.noContent().build();
        return ResponseEntity.ok(bookings);
    }

    @GetMapping("/availability")
    public ResponseEntity<List<IntervalDto>> getAvailability(
            @RequestParam("facilityId") Long facilityId,
            @RequestParam("date") @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        return ResponseEntity.ok(bookingService.getAvailability(facilityId, date));
    }

    @PostMapping
    public ResponseEntity<Booking> createBooking(HttpServletRequest request, @RequestBody BookingRequest bookingRequest) {
        return ResponseEntity.ok(bookingService.createBooking(request, bookingRequest));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteBooking(HttpServletRequest request, @PathVariable Long id) {
        bookingService.deleteBooking(request, id);
        return ResponseEntity.noContent().build();
    }
}
