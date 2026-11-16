<?php

namespace App\Domain\GIS;

use InvalidArgumentException;

class GeoCoordinate
{
    public function __construct(
        public readonly float $latitude,
        public readonly float $longitude
    ) {
        $this->validate();
    }

    /**
     * Validate coordinate boundaries for Indonesian Archipelago
     * Latitude: ~ -11.5 to 6.5
     * Longitude: ~ 95.0 to 141.5
     */
    private function validate(): void
    {
        if ($this->latitude < -12.0 || $this->latitude > 7.0) {
            throw new InvalidArgumentException("Latitude {$this->latitude} berada di luar wilayah teritorial Indonesia (-12.0 s/d 7.0).");
        }

        if ($this->longitude < 94.0 || $this->longitude > 142.0) {
            throw new InvalidArgumentException("Longitude {$this->longitude} berada di luar wilayah teritorial Indonesia (94.0 s/d 142.0).");
        }
    }

    public function toArray(): array
    {
        return [
            'latitude' => $this->latitude,
            'longitude' => $this->longitude,
        ];
    }
}
