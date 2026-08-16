package com.booking_service.service;

import com.booking_service.availability.AvailabilityService;
import com.booking_service.configuration.feignclients.ClubFeignClient;
import com.booking_service.configuration.feignclients.SportsFacilityFeignClient;
import com.booking_service.persistence.Booking;
import com.booking_service.persistence.IBookingRepository;
import com.booking_service.presentation.SearchRequest;
import com.booking_service.presentation.SearchResponse;
import com.booking_service.presentation.SportType;
import com.booking_service.presentation.dtos.ClubDto;
import com.booking_service.presentation.dtos.OpeningHoursDto;
import com.booking_service.presentation.dtos.SportsFacilityDto;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

class SearchServiceTest {

    private ClubFeignClient clubFeignClient;
    private SportsFacilityFeignClient facilityFeignClient;
    private IBookingRepository bookingRepository;
    private SearchService searchService;

    private ClubDto club;
    private SportsFacilityDto facility;
    private LocalDate date;

    @BeforeEach
    void setUp() {
        clubFeignClient = mock(ClubFeignClient.class);
        facilityFeignClient = mock(SportsFacilityFeignClient.class);
        bookingRepository = mock(IBookingRepository.class);
        searchService = new SearchService(clubFeignClient, facilityFeignClient,
                bookingRepository, new AvailabilityService());

        date = LocalDate.now().plusDays(1);

        club = new ClubDto();
        club.setId(1L);
        club.setName("Club A");
        club.setAddress("Address");
        List<OpeningHoursDto> hours = new ArrayList<>();
        for (DayOfWeek day : DayOfWeek.values()) {
            hours.add(new OpeningHoursDto(day, LocalTime.of(8, 0), LocalTime.of(20, 0)));
        }
        club.setOpeningHours(hours);

        facility = new SportsFacilityDto();
        facility.setId(10L);
        facility.setClubId(1L);
        facility.setName("Field 1");
        facility.setSportType(SportType.FOOTBALL);
    }

    @Test
    void shouldReturnEmptyWhenNoClubs() {
        when(clubFeignClient.getNearbyClubs(anyDouble(), anyDouble(), anyDouble()))
                .thenReturn(List.of());

        SearchRequest req = new SearchRequest(-34.0, -58.0, 5.0, List.of(SportType.FOOTBALL), date);
        List<SearchResponse> result = searchService.search(req);

        assertTrue(result.isEmpty());
        verifyNoInteractions(facilityFeignClient);
    }

    @Test
    void shouldReturnEmptyWhenNoFacilities() {
        when(clubFeignClient.getNearbyClubs(anyDouble(), anyDouble(), anyDouble()))
                .thenReturn(List.of(club));
        when(facilityFeignClient.search(any())).thenReturn(List.of());

        SearchRequest req = new SearchRequest(-34.0, -58.0, 5.0, List.of(SportType.FOOTBALL), date);
        List<SearchResponse> result = searchService.search(req);

        assertTrue(result.isEmpty());
    }

    @Test
    void shouldReturnAvailableFacilityWhenNoBookingsOnDate() {
        when(clubFeignClient.getNearbyClubs(anyDouble(), anyDouble(), anyDouble()))
                .thenReturn(List.of(club));
        when(facilityFeignClient.search(any())).thenReturn(List.of(facility));
        when(bookingRepository.findBookingsOverlappingDay(anyList(), any(), any()))
                .thenReturn(List.of());

        SearchRequest req = new SearchRequest(-34.0, -58.0, 5.0, List.of(SportType.FOOTBALL), date);
        List<SearchResponse> result = searchService.search(req);

        assertEquals(1, result.size());
        assertTrue(result.getFirst().isAvailable());
        assertEquals("Field 1", result.getFirst().getFacilityName());
    }

    @Test
    void shouldMarkFacilityUnavailableWhenFullyBooked() {
        Booking booking = Booking.builder()
                .sportsFacilityId(10L)
                .start(date.atTime(8, 0))
                .end(date.atTime(20, 0))
                .build();

        when(clubFeignClient.getNearbyClubs(anyDouble(), anyDouble(), anyDouble()))
                .thenReturn(List.of(club));
        when(facilityFeignClient.search(any())).thenReturn(List.of(facility));
        when(bookingRepository.findBookingsOverlappingDay(anyList(), any(), any()))
                .thenReturn(List.of(booking));

        SearchRequest req = new SearchRequest(-34.0, -58.0, 5.0, List.of(SportType.FOOTBALL), date);
        List<SearchResponse> result = searchService.search(req);

        assertEquals(1, result.size());
        assertFalse(result.getFirst().isAvailable());
    }

    @Test
    void shouldMarkFacilityAvailableWhenPartiallyBooked() {
        Booking booking = Booking.builder()
                .sportsFacilityId(10L)
                .start(date.atTime(10, 0))
                .end(date.atTime(11, 0))
                .build();

        when(clubFeignClient.getNearbyClubs(anyDouble(), anyDouble(), anyDouble()))
                .thenReturn(List.of(club));
        when(facilityFeignClient.search(any())).thenReturn(List.of(facility));
        when(bookingRepository.findBookingsOverlappingDay(anyList(), any(), any()))
                .thenReturn(List.of(booking));

        SearchRequest req = new SearchRequest(-34.0, -58.0, 5.0, List.of(SportType.FOOTBALL), date);
        List<SearchResponse> result = searchService.search(req);

        assertEquals(1, result.size());
        assertTrue(result.getFirst().isAvailable());
    }

    @Test
    void shouldReturnAllFacilitiesWhenDateIsNull() {
        when(clubFeignClient.getNearbyClubs(anyDouble(), anyDouble(), anyDouble()))
                .thenReturn(List.of(club));
        when(facilityFeignClient.search(any())).thenReturn(List.of(facility));

        SearchRequest req = new SearchRequest(-34.0, -58.0, 5.0, null, null);
        List<SearchResponse> result = searchService.search(req);

        assertEquals(1, result.size());
        assertTrue(result.getFirst().isAvailable());
        verifyNoInteractions(bookingRepository);
    }

    @Test
    void shouldNotFilterBySportTypeWhenSportTypesIsEmpty() {
        when(clubFeignClient.getNearbyClubs(anyDouble(), anyDouble(), anyDouble()))
                .thenReturn(List.of(club));
        when(facilityFeignClient.search(any())).thenReturn(List.of(facility));

        SearchRequest req = new SearchRequest(-34.0, -58.0, 5.0, List.of(), null);
        List<SearchResponse> result = searchService.search(req);

        assertEquals(1, result.size());
        verifyNoInteractions(bookingRepository);
    }
}
