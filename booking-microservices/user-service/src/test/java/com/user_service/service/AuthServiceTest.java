package com.user_service.service;

import com.user_service.configuration.feignclients.ClubFeignClient;
import com.user_service.configuration.security.JwtService;
import com.user_service.persistence.AppUser;
import com.user_service.persistence.IAppUserRepository;
import com.user_service.persistence.Role;
import com.user_service.presentation.CreateClubRequest;
import com.user_service.presentation.LoginRequest;
import com.user_service.presentation.RegisterRequest;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

    @Mock
    private IAppUserRepository repository;

    @Mock
    private JwtService jwtService;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private ClubFeignClient clubFeignClient;

    @InjectMocks
    private AuthService authService;

    @Test
    void shouldRegisterUser() {

        RegisterRequest req = new RegisterRequest("Juan", "juan@test.com", "1234");

        when(passwordEncoder.encode("1234")).thenReturn("encoded");
        when(repository.save(any())).thenAnswer(i -> i.getArgument(0));
        when(jwtService.generateToken(any())).thenReturn("token");

        String token = authService.registerUser(req);

        assertEquals("token", token);

        verify(repository).save(any(AppUser.class));
    }

    @Test
    void shouldRegisterClubAndCreateClub() {

        RegisterRequest req = new RegisterRequest("Club A", "club@test.com", "1234");

        AppUser saved = AppUser.builder()
                .id(10L)
                .name("Club A")
                .email("club@test.com")
                .password("encoded")
                .role(Role.CLUB)
                .build();

        when(passwordEncoder.encode(any())).thenReturn("encoded");
        when(repository.save(any())).thenReturn(saved);
        when(jwtService.generateToken(saved)).thenReturn("token");

        String token = authService.registerClub(req);

        assertEquals("token", token);

        verify(clubFeignClient).createClub(
                new CreateClubRequest(10L, "Club A")
        );
    }

    @Test
    void shouldLoginSuccessfully() {

        AppUser user = AppUser.builder()
                .email("test@test.com")
                .password("encoded")
                .build();

        when(repository.findByEmail("test@test.com")).thenReturn(Optional.of(user));
        when(passwordEncoder.matches("1234", "encoded")).thenReturn(true);
        when(jwtService.generateToken(user)).thenReturn("token");

        String token = authService.login(new LoginRequest("test@test.com", "1234"));

        assertEquals("token", token);
    }

    @Test
    void shouldThrowWhenPasswordInvalid() {

        AppUser user = AppUser.builder()
                .email("test@test.com")
                .password("encoded")
                .build();

        when(repository.findByEmail("test@test.com")).thenReturn(Optional.of(user));
        when(passwordEncoder.matches(any(), any())).thenReturn(false);

        assertThrows(RuntimeException.class, () ->
                authService.login(new LoginRequest("test@test.com", "wrong"))
        );
    }

    @Test
    void shouldThrowWhenUserNotFound() {

        when(repository.findByEmail(any())).thenReturn(Optional.empty());

        assertThrows(RuntimeException.class, () ->
                authService.login(new LoginRequest("test@test.com", "1234"))
        );
    }
}