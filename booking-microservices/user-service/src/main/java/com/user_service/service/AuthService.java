package com.user_service.service;

import com.user_service.configuration.feignclients.ClubFeignClient;
import com.user_service.configuration.security.JwtService;
import com.user_service.persistence.AppUser;
import com.user_service.persistence.IAppUserRepository;
import com.user_service.persistence.Role;
import com.user_service.presentation.CreateClubRequest;
import com.user_service.presentation.LoginRequest;
import com.user_service.presentation.RegisterRequest;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
public class AuthService {

    private final IAppUserRepository repository;
    private final JwtService jwtService;
    private final PasswordEncoder passwordEncoder;
    private final ClubFeignClient clubFeignClient;

    public AuthService(IAppUserRepository repository, JwtService jwtService,
                       PasswordEncoder passwordEncoder, ClubFeignClient clubFeignClient) {
        this.repository = repository;
        this.jwtService = jwtService;
        this.passwordEncoder = passwordEncoder;
        this.clubFeignClient = clubFeignClient;
    }

    public String registerUser(RegisterRequest request) {

        AppUser user = AppUser.builder()
                .name(request.name())
                .email(request.email())
                .password(passwordEncoder.encode(request.password()))
                .role(Role.USER)
                .build();

        repository.save(user);

        return jwtService.generateToken(user);
    }

    public String registerClub(RegisterRequest request) {

        AppUser user = AppUser.builder()
                .name(request.name())
                .email(request.email())
                .password(passwordEncoder.encode(request.password()))
                .role(Role.CLUB)
                .build();

        AppUser saved = repository.save(user);

        clubFeignClient.createClub(new CreateClubRequest(saved.getId(), saved.getName()));

        return jwtService.generateToken(saved);
    }

    public String login(LoginRequest request) {

        AppUser user = repository.findByEmail(request.email())
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (!passwordEncoder.matches(request.password(), user.getPassword())) {
            throw new RuntimeException("Invalid credentials");
        }

        return jwtService.generateToken(user);
    }

}
