package com.booking_service.presentation;

import com.booking_service.service.SearchService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/search")
public class SearchController {

    private final SearchService searchService;

    public SearchController(SearchService searchService) {
        this.searchService = searchService;
    }

    @PostMapping
    public ResponseEntity<List<SearchResponse>> search(@RequestBody SearchRequest request){
        List<SearchResponse> response = searchService.search(request);
        if (response == null || response.isEmpty()) return ResponseEntity.noContent().build();
        return ResponseEntity.ok(response);
    }
}
