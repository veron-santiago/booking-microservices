package com.user_service.service;

import com.user_service.persistence.AppUser;
import com.user_service.persistence.IAppUserRepository;
import com.user_service.util.JwtUtil;
import jakarta.servlet.http.HttpServletRequest;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AppUserServiceTest {

    @Mock
    private IAppUserRepository repository;

    @Mock
    private JwtUtil jwtUtil;

    @InjectMocks
    private AppUserService service;

    @Test
    void shouldReturnUserFromHeader() {

        AppUser user = AppUser.builder()
                .id(1L)
                .name("Juan")
                .build();

        when(jwtUtil.extractUserId(any())).thenReturn(1L);
        when(repository.findById(1L)).thenReturn(Optional.of(user));

        AppUser result = service.getUserByHeader(mock(HttpServletRequest.class));

        assertNotNull(result);
        assertEquals(1L, result.getId());
        assertEquals("Juan", result.getName());
    }

    @Test
    void shouldReturnNullWhenUserNotFound() {

        when(jwtUtil.extractUserId(any())).thenReturn(1L);
        when(repository.findById(1L)).thenReturn(Optional.empty());

        AppUser result = service.getUserByHeader(mock(HttpServletRequest.class));

        assertNull(result);
    }

    @Test
    void shouldDeleteUserByIdFromToken() {

        when(jwtUtil.extractUserId(any())).thenReturn(5L);

        service.deleteAppUser(mock(HttpServletRequest.class));

        verify(repository).deleteById(5L);
    }
}