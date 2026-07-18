package org.primfocusinc.workflow.config;

import com.google.firebase.auth.FirebaseAuth;
import org.primfocusinc.workflow.security.FirebaseTokenAuthenticationFilter;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

/**
 * Local-dev security configuration: every request is permitted so the app
 * is easy to hit without a real Firebase ID token. The Firebase token filter
 * is still wired in so a token can optionally be supplied to exercise
 * role-gated ({@code @PreAuthorize}) endpoints while developing locally.
 */
@Configuration
@Profile("local")
@EnableMethodSecurity
public class LocalSecurityConfig {

    @Bean
    SecurityFilterChain securityFilterChain(HttpSecurity http, FirebaseAuth firebaseAuth) throws Exception {
        http
            .csrf(csrf -> csrf.disable())
            .authorizeHttpRequests(auth -> auth.anyRequest().permitAll())
            .addFilterBefore(new FirebaseTokenAuthenticationFilter(firebaseAuth), UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }
}
