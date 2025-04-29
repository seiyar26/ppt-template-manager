#!/bin/bash
# wait-for-postgres.sh

set -e

host=$(echo $DATABASE_URL | sed -E 's/^.*@([^:]+).*$/\1/')
port=$(echo $DATABASE_URL | sed -E 's/^.*:([0-9]+)\/.*$/\1/')

echo "Attente de PostgreSQL sur $host:$port..."

# Si host vaut 'postgres', c'est qu'on est en configuration Docker Compose
if [ "$host" = "postgres" ]; then
  until pg_isready -h "$host" -p "$port"; do
    echo "PostgreSQL n'est pas encore disponible - attente..."
    sleep 2
  done
# Si host contient host.docker.internal, c'est qu'on utilise le PostgreSQL de la machine hôte
elif echo "$host" | grep -q "host.docker.internal"; then
  until pg_isready -h "$host" -p "$port"; do
    echo "PostgreSQL sur la machine hôte n'est pas encore disponible - attente..."
    sleep 2
  done
# Cas pour localhost ou 127.0.0.1
elif [ "$host" = "localhost" ] || [ "$host" = "127.0.0.1" ]; then
  until pg_isready -h "$host" -p "$port"; do
    echo "PostgreSQL local n'est pas encore disponible - attente..."
    sleep 2
  done
fi

echo "PostgreSQL est prêt!"

# Exécute la commande passée en paramètre
exec "$@"
