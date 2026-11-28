#!/bin/bash
psql -f create_db.sql &&
    psql -f create_auth.sql &&
    psql -f populate_db.sql
