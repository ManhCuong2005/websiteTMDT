CREATE TABLE face_templates (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    encrypted_embedding TEXT NOT NULL,
    model_version VARCHAR(50) NOT NULL,
    failed_attempts INTEGER NOT NULL DEFAULT 0,
    locked_until TIMESTAMP,
    last_verified_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE face_challenges (
    id BIGSERIAL PRIMARY KEY,
    token_hash VARCHAR(64) NOT NULL UNIQUE,
    email_hash VARCHAR(64) NOT NULL,
    challenge_type VARCHAR(30) NOT NULL
        CHECK (challenge_type IN ('TURN_HEAD', 'MOVE_CLOSER')),
    expires_at TIMESTAMP NOT NULL,
    consumed_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_face_challenges_email_created
    ON face_challenges(email_hash, created_at DESC);

CREATE INDEX idx_face_challenges_expiry
    ON face_challenges(expires_at);
