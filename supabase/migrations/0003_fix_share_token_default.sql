-- Fix: Postgres' encode() kent geen "base64url" als encoding (alleen base64,
-- hex, escape). We bouwen een URL-veilige base64-variant zelf op door +, /
-- en de = padding te vervangen/strippen.

alter table quotes
  alter column share_token set default
    regexp_replace(
      replace(replace(encode(gen_random_bytes(24), 'base64'), '+', '-'), '/', '_'),
      '=+$', ''
    );
