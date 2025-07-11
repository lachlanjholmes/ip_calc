#!/bin/bash

CONTAINER_CLI="podman"
if ! command -v $CONTAINER_CLI &> /dev/null
then
    CONTAINER_CLI="docker"
    if ! command -v $CONTAINER_CLI &> /dev/null
    then
        echo "Error: Neither Podman nor Docker is installed. Please install one of them to run the application."
        exit 1
    fi
fi

$CONTAINER_CLI rm -f ip_calc
$CONTAINER_CLI build --no-cache -t ip_calc .
$CONTAINER_CLI run -d -p 8085:80 --name ip_calc ip_calc