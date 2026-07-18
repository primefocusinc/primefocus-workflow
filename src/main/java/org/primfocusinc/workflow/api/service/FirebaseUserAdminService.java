package org.primfocusinc.workflow.api.service;

import com.google.firebase.auth.FirebaseAuth;
import com.google.firebase.auth.FirebaseAuthException;
import org.springframework.stereotype.Service;

import java.util.Map;
import java.util.Set;

/**
 * Administrative operations against Firebase Authentication itself (as
 * opposed to {@code UserService}, which manages app-level profile documents
 * in Firestore). Used to assign the {@code roles} custom claim that
 * {@link org.primfocusinc.workflow.security.FirebaseTokenAuthenticationFilter}
 * reads out of each verified ID token.
 */
@Service
public class FirebaseUserAdminService {

    private final FirebaseAuth firebaseAuth;

    public FirebaseUserAdminService(FirebaseAuth firebaseAuth) {
        this.firebaseAuth = firebaseAuth;
    }

    public void setRoles(String uid, Set<String> roles) throws FirebaseAuthException {
        firebaseAuth.setCustomUserClaims(uid, Map.of("roles", roles));
    }
}
