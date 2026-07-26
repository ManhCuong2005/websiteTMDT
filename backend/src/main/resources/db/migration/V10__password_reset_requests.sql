CREATE TABLE password_reset_requests (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    verification_code_hash VARCHAR(255),
    reset_token_hash VARCHAR(64),
    code_expires_at TIMESTAMP NOT NULL,
    reset_token_expires_at TIMESTAMP,
    failed_attempts INTEGER NOT NULL DEFAULT 0 CHECK (failed_attempts >= 0),
    last_sent_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX uk_password_reset_token_hash
    ON password_reset_requests(reset_token_hash)
    WHERE reset_token_hash IS NOT NULL;

CREATE INDEX idx_password_reset_code_expires_at
    ON password_reset_requests(code_expires_at);
