/**
 * Standard Indonesian Provinces and Cities/Regencies for V-Green SSI Platform.
 * Structured by Province with normalized names matching database records.
 */

export interface ProvinceRegion {
    name: string;
    cities: string[];
}

export const INDONESIA_REGIONS: ProvinceRegion[] = [
    {
        name: 'DKI Jakarta',
        cities: [
            'Jakarta Selatan',
            'Jakarta Pusat',
            'Jakarta Barat',
            'Jakarta Utara',
            'Jakarta Timur',
            'Kepulauan Seribu',
        ],
    },
    {
        name: 'Jawa Barat',
        cities: [
            'Bandung',
            'Kota Bandung',
            'Kab. Bandung',
            'Bandung Barat',
            'Bekasi',
            'Kota Bekasi',
            'Kab. Bekasi',
            'Bogor',
            'Kota Bogor',
            'Kab. Bogor',
            'Depok',
            'Cimahi',
            'Cirebon',
            'Kota Cirebon',
            'Kab. Cirebon',
            'Sukabumi',
            'Tasikmalaya',
            'Karawang',
            'Purwakarta',
            'Subang',
            'Sumedang',
            'Garut',
            'Indramayu',
            'Majalengka',
            'Kuningan',
            'Ciamis',
            'Pangandaran',
            'Cianjur',
            'Banjar',
        ],
    },
    {
        name: 'Jawa Timur',
        cities: [
            'Surabaya',
            'Kota Surabaya',
            'Malang',
            'Kota Malang',
            'Kab. Malang',
            'Sidoarjo',
            'Gresik',
            'Batu',
            'Kediri',
            'Madiun',
            'Blitar',
            'Mojokerto',
            'Pasuruan',
            'Probolinggo',
            'Banyuwangi',
            'Jember',
            'Bojonegoro',
            'Tuban',
            'Lamongan',
            'Jombang',
            'Nganjuk',
            'Tulungagung',
            'Trenggalek',
            'Ponorogo',
            'Pacitan',
            'Ngawi',
            'Magetan',
            'Lumajang',
            'Bondowoso',
            'Situbondo',
        ],
    },
    {
        name: 'Jawa Tengah',
        cities: [
            'Semarang',
            'Kota Semarang',
            'Kab. Semarang',
            'Surakarta (Solo)',
            'Solo',
            'Salatiga',
            'Magelang',
            'Pekalongan',
            'Tegal',
            'Banyumas (Purwokerto)',
            'Kudus',
            'Cilacap',
            'Brebes',
            'Boyolali',
            'Klaten',
            'Sukoharjo',
            'Karanganyar',
            'Wonogiri',
            'Sragen',
            'Grobogan',
            'Blora',
            'Rembang',
            'Pati',
            'Jepara',
            'Demak',
            'Temanggung',
            'Wonosobo',
            'Purworejo',
            'Kebumen',
            'Banjarnegara',
            'Purbalingga',
            'Batang',
            'Pemalang',
            'Kendal',
        ],
    },
    {
        name: 'Banten',
        cities: [
            'Tangerang',
            'Kota Tangerang',
            'Kab. Tangerang',
            'Tangerang Selatan',
            'Serang',
            'Kota Serang',
            'Kab. Serang',
            'Cilegon',
            'Lebak',
            'Pandeglang',
        ],
    },
    {
        name: 'D.I. Yogyakarta',
        cities: [
            'Yogyakarta',
            'Kota Yogyakarta',
            'Sleman',
            'Bantul',
            'Gunungkidul',
            'Kulon Progo',
        ],
    },
    {
        name: 'Bali',
        cities: [
            'Denpasar',
            'Kota Denpasar',
            'Badung',
            'Gianyar',
            'Tabanan',
            'Buleleng',
            'Klungkung',
            'Bangli',
            'Karangasem',
            'Jembrana',
        ],
    },
    {
        name: 'Sumatera Utara',
        cities: [
            'Medan',
            'Kota Medan',
            'Binjai',
            'Pematangsiantar',
            'Tebing Tinggi',
            'Tanjungbalai',
            'Sibolga',
            'Padangsidimpuan',
            'Gunungsitoli',
            'Deli Serdang',
            'Karo',
            'Simalungun',
            'Asahan',
            'Toba',
        ],
    },
    {
        name: 'Sumatera Barat',
        cities: [
            'Padang',
            'Kota Padang',
            'Bukittinggi',
            'Payakumbuh',
            'Solok',
            'Sawahlunto',
            'Padang Panjang',
            'Pariaman',
            'Agam',
            'Tanah Datar',
        ],
    },
    {
        name: 'Riau',
        cities: [
            'Pekanbaru',
            'Kota Pekanbaru',
            'Dumai',
            'Kampar',
            'Siak',
            'Pelalawan',
            'Bengkalis',
            'Rokan Hulu',
            'Rokan Hilir',
            'Indragiri Hulu',
            'Indragiri Hilir',
            'Kuantan Singingi',
            'Kepulauan Meranti',
        ],
    },
    {
        name: 'Kepulauan Riau',
        cities: [
            'Batam',
            'Kota Batam',
            'Tanjungpinang',
            'Bintan',
            'Karimun',
            'Natuna',
            'Anambas',
            'Lingga',
        ],
    },
    {
        name: 'Sumatera Selatan',
        cities: [
            'Palembang',
            'Kota Palembang',
            'Prabumulih',
            'Pagar Alam',
            'Lubuklinggau',
            'Banyuasin',
            'Ogan Ilir',
            'Ogan Komering Ilir',
            'Muara Enim',
            'Lahat',
        ],
    },
    {
        name: 'Lampung',
        cities: [
            'Bandar Lampung',
            'Kota Bandar Lampung',
            'Metro',
            'Lampung Selatan',
            'Lampung Tengah',
            'Lampung Timur',
            'Pesawaran',
            'Pringsewu',
            'Tanggamus',
        ],
    },
    {
        name: 'Kalimantan Timur',
        cities: [
            'Balikpapan',
            'Kota Balikpapan',
            'Samarinda',
            'Penajam Paser',
            'Penajam Paser (IKN)',
            'Kutai Kartanegara',
            'Bontang',
            'Kutai Timur',
            'Berau',
            'Paser',
        ],
    },
    {
        name: 'Kalimantan Selatan',
        cities: [
            'Banjarmasin',
            'Kota Banjarmasin',
            'Banjarbaru',
            'Banjar',
            'Barito Kuala',
            'Tanah Laut',
            'Tanah Bumbu',
            'Kotabaru',
            'Tabalong',
        ],
    },
    {
        name: 'Kalimantan Barat',
        cities: [
            'Pontianak',
            'Kota Pontianak',
            'Singkawang',
            'Kubu Raya',
            'Mempawah',
            'Sambas',
            'Ketapang',
            'Sintang',
        ],
    },
    {
        name: 'Kalimantan Tengah',
        cities: [
            'Palangka Raya',
            'Kotawaringin Timur',
            'Kotawaringin Barat',
            'Kapuas',
            'Barito Selatan',
        ],
    },
    {
        name: 'Kalimantan Utara',
        cities: [
            'Tarakan',
            'Bulungan',
            'Nunukan',
            'Malinau',
        ],
    },
    {
        name: 'Sulawesi Selatan',
        cities: [
            'Makassar',
            'Kota Makassar',
            'Parepare',
            'Palopo',
            'Gowa',
            'Maros',
            'Pangkajene Kepulauan',
            'Barru',
            'Bone',
            'Soppeng',
            'Wajo',
            'Bulukumba',
            'Bantaeng',
        ],
    },
    {
        name: 'Sulawesi Utara',
        cities: [
            'Manado',
            'Kota Manado',
            'Bitung',
            'Tomohon',
            'Kotamobagu',
            'Minahasa',
            'Minahasa Utara',
            'Minahasa Selatan',
        ],
    },
    {
        name: 'Sulawesi Tengah',
        cities: [
            'Palu',
            'Donggala',
            'Poso',
            'Banggai',
            'Morowali',
            'Morowali Utara',
            'Parigi Moutong',
            'Toli-Toli',
        ],
    },
    {
        name: 'Sulawesi Tenggara',
        cities: [
            'Kendari',
            'Baubau',
            'Konawe',
            'Kolaka',
            'Muna',
            'Buton',
        ],
    },
    {
        name: 'Gorontalo',
        cities: [
            'Gorontalo',
            'Gorontalo Utara',
            'Bone Bolango',
            'Pohuwato',
            'Boalemo',
        ],
    },
    {
        name: 'Sulawesi Barat',
        cities: [
            'Mamuju',
            'Majene',
            'Polewali Mandar',
            'Pasangkayu',
        ],
    },
    {
        name: 'Nusa Tenggara Barat',
        cities: [
            'Mataram',
            'Bima',
            'Lombok Barat',
            'Lombok Tengah',
            'Lombok Timur',
            'Sumbawa',
            'Dompu',
        ],
    },
    {
        name: 'Nusa Tenggara Timur',
        cities: [
            'Kupang',
            'Manggarai Barat (Labuan Bajo)',
            'Sikka',
            'Ende',
            'Sumba Timur',
            'Belu',
        ],
    },
    {
        name: 'Maluku',
        cities: [
            'Ambon',
            'Tual',
            'Maluku Tengah',
            'Buru',
            'Seram Bagian Barat',
        ],
    },
    {
        name: 'Maluku Utara',
        cities: [
            'Ternate',
            'Tidore Kepulauan',
            'Halmahera Barat',
            'Halmahera Utara',
            'Halmahera Selatan',
        ],
    },
    {
        name: 'Papua',
        cities: [
            'Jayapura',
            'Kota Jayapura',
            'Keerom',
            'Sarmi',
            'Mamberamo Raya',
        ],
    },
    {
        name: 'Papua Barat',
        cities: [
            'Manokwari',
            'Fakfak',
            'Kaimana',
            'Teluk Bintuni',
        ],
    },
    {
        name: 'Papua Barat Daya',
        cities: [
            'Sorong',
            'Raja Ampat',
            'Sorong Selatan',
        ],
    },
    {
        name: 'Papua Tengah',
        cities: [
            'Nabire',
            'Mimika (Timika)',
            'Paniai',
            'Puncak Jaya',
        ],
    },
    {
        name: 'Papua Pegunungan',
        cities: [
            'Jayawijaya (Wamena)',
            'Tolikara',
            'Lanny Jaya',
        ],
    },
    {
        name: 'Papua Selatan',
        cities: [
            'Merauke',
            'Boven Digoel',
            'Mappi',
            'Asmat',
        ],
    },
    {
        name: 'Aceh',
        cities: [
            'Banda Aceh',
            'Sabang',
            'Lhokseumawe',
            'Langsa',
            'Subulussalam',
            'Aceh Besar',
            'Aceh Utara',
            'Bireuen',
            'Aceh Tengah',
        ],
    },
    {
        name: 'Jambi',
        cities: [
            'Jambi',
            'Kota Jambi',
            'Sungai Penuh',
            'Muaro Jambi',
            'Batanghari',
            'Tanjung Jabung Barat',
            'Bungo',
            'Merangin',
        ],
    },
    {
        name: 'Bengkulu',
        cities: [
            'Bengkulu',
            'Kota Bengkulu',
            'Rejang Lebong',
            'Bengkulu Utara',
            'Mukomuko',
            'Seluma',
            'Kaur',
        ],
    },
    {
        name: 'Kepulauan Bangka Belitung',
        cities: [
            'Pangkalpinang',
            'Bangka',
            'Belitung',
            'Belitung Timur',
            'Bangka Barat',
            'Bangka Tengah',
            'Bangka Selatan',
        ],
    },
];

/**
 * Get list of all province names.
 */
export const getAllProvinces = (): string[] => {
    return INDONESIA_REGIONS.map((r) => r.name);
};

/**
 * Get list of cities for a given province name.
 */
export const getCitiesByProvince = (provinceName: string): string[] => {
    if (!provinceName) return [];
    const region = INDONESIA_REGIONS.find(
        (r) => r.name.toLowerCase() === provinceName.trim().toLowerCase()
    );
    return region ? region.cities : [];
};

/**
 * Center coordinates for all 38 Indonesian Provinces.
 */
export const PROVINCE_COORDINATES: Record<string, { lat: number; lng: number }> = {
    'DKI Jakarta': { lat: -6.2088, lng: 106.8456 },
    'Jawa Barat': { lat: -6.9175, lng: 107.6191 },
    'Jawa Timur': { lat: -7.2575, lng: 112.7521 },
    'Jawa Tengah': { lat: -6.9667, lng: 110.4167 },
    'Banten': { lat: -6.1783, lng: 106.6319 },
    'D.I. Yogyakarta': { lat: -7.7956, lng: 110.3695 },
    'Bali': { lat: -8.6705, lng: 115.2126 },
    'Sumatera Utara': { lat: 3.5952, lng: 98.6722 },
    'Sumatera Barat': { lat: -0.9471, lng: 100.4172 },
    'Riau': { lat: 0.5071, lng: 101.4478 },
    'Kepulauan Riau': { lat: 1.1301, lng: 104.0529 },
    'Sumatera Selatan': { lat: -2.9761, lng: 104.7754 },
    'Lampung': { lat: -5.4500, lng: 105.2667 },
    'Jambi': { lat: -1.6101, lng: 103.6131 },
    'Bengkulu': { lat: -3.7928, lng: 102.2608 },
    'Kepulauan Bangka Belitung': { lat: -2.1316, lng: 106.1169 },
    'Aceh': { lat: 5.5483, lng: 95.3238 },
    'Kalimantan Timur': { lat: -0.9634, lng: 116.7027 },
    'Kalimantan Selatan': { lat: -3.3194, lng: 114.5908 },
    'Kalimantan Barat': { lat: -0.0263, lng: 109.3425 },
    'Kalimantan Tengah': { lat: -2.2161, lng: 113.9139 },
    'Kalimantan Utara': { lat: 3.3270, lng: 117.5965 },
    'Sulawesi Selatan': { lat: -5.1477, lng: 119.4327 },
    'Sulawesi Utara': { lat: 1.4748, lng: 124.8421 },
    'Sulawesi Tengah': { lat: -0.9003, lng: 119.8779 },
    'Sulawesi Tenggara': { lat: -3.9985, lng: 122.5126 },
    'Gorontalo': { lat: 0.5435, lng: 123.0568 },
    'Sulawesi Barat': { lat: -2.6770, lng: 118.8890 },
    'Nusa Tenggara Barat': { lat: -8.5799, lng: 116.0999 },
    'Nusa Tenggara Timur': { lat: -10.1772, lng: 123.6070 },
    'Maluku': { lat: -3.6547, lng: 128.1906 },
    'Maluku Utara': { lat: 0.7904, lng: 127.3804 },
    'Papua': { lat: -2.5916, lng: 140.6690 },
    'Papua Barat': { lat: -0.8615, lng: 134.0620 },
    'Papua Barat Daya': { lat: -0.8762, lng: 131.2558 },
    'Papua Tengah': { lat: -3.3646, lng: 135.4984 },
    'Papua Pegunungan': { lat: -4.0981, lng: 138.9442 },
    'Papua Selatan': { lat: -8.4991, lng: 140.4011 },
};

/**
 * Coordinate dictionary for major Indonesian cities/regencies.
 */
export const CITY_COORDINATES: Record<string, { lat: number; lng: number }> = {
    // DKI Jakarta
    'jakarta selatan': { lat: -6.2615, lng: 106.8106 },
    'jakarta pusat': { lat: -6.1805, lng: 106.8284 },
    'jakarta barat': { lat: -6.1683, lng: 106.7589 },
    'jakarta utara': { lat: -6.1384, lng: 106.8640 },
    'jakarta timur': { lat: -6.2250, lng: 106.9004 },
    'kepulauan seribu': { lat: -5.6122, lng: 106.5611 },

    // Jawa Barat
    'bandung': { lat: -6.9175, lng: 107.6191 },
    'kota bandung': { lat: -6.9175, lng: 107.6191 },
    'kab. bandung': { lat: -7.0253, lng: 107.5198 },
    'bandung barat': { lat: -6.8439, lng: 107.5029 },
    'bekasi': { lat: -6.2383, lng: 106.9756 },
    'kota bekasi': { lat: -6.2383, lng: 106.9756 },
    'kab. bekasi': { lat: -6.3645, lng: 107.1725 },
    'bogor': { lat: -6.5971, lng: 106.8060 },
    'kota bogor': { lat: -6.5971, lng: 106.8060 },
    'kab. bogor': { lat: -6.4797, lng: 106.8249 },
    'depok': { lat: -6.4025, lng: 106.7942 },
    'cimahi': { lat: -6.8723, lng: 107.5422 },
    'cirebon': { lat: -6.7320, lng: 108.5523 },
    'kota cirebon': { lat: -6.7320, lng: 108.5523 },
    'kab. cirebon': { lat: -6.7645, lng: 108.4789 },
    'sukabumi': { lat: -6.9277, lng: 106.9300 },
    'tasikmalaya': { lat: -7.3274, lng: 108.2207 },
    'karawang': { lat: -6.3073, lng: 107.3075 },
    'purwakarta': { lat: -6.5569, lng: 107.4433 },
    'subang': { lat: -6.5716, lng: 107.7587 },
    'sumedang': { lat: -6.8587, lng: 107.9266 },
    'garut': { lat: -7.2274, lng: 107.9087 },
    'indramayu': { lat: -6.3264, lng: 108.3200 },
    'majalengka': { lat: -6.8361, lng: 108.2276 },
    'kuningan': { lat: -6.9764, lng: 108.4831 },
    'ciamis': { lat: -7.3256, lng: 108.3533 },
    'pangandaran': { lat: -7.7009, lng: 108.6508 },
    'cianjur': { lat: -6.8222, lng: 107.1394 },
    'banjar': { lat: -7.3695, lng: 108.5332 },

    // Banten
    'tangerang': { lat: -6.1783, lng: 106.6319 },
    'kota tangerang': { lat: -6.1783, lng: 106.6319 },
    'tangerang selatan': { lat: -6.2889, lng: 106.7179 },
    'kab. tangerang': { lat: -6.1950, lng: 106.4777 },
    'serang': { lat: -6.1104, lng: 106.1640 },
    'kota serang': { lat: -6.1104, lng: 106.1640 },
    'kab. serang': { lat: -6.1200, lng: 106.1500 },
    'cilegon': { lat: -6.0023, lng: 106.0152 },
    'pandeglang': { lat: -6.3084, lng: 106.1065 },
    'lebak': { lat: -6.5432, lng: 106.2529 },

    // Jawa Tengah
    'semarang': { lat: -6.9667, lng: 110.4167 },
    'kota semarang': { lat: -6.9667, lng: 110.4167 },
    'kab. semarang': { lat: -7.1415, lng: 110.4069 },
    'surakarta': { lat: -7.5755, lng: 110.8243 },
    'solo': { lat: -7.5755, lng: 110.8243 },
    'salatiga': { lat: -7.3305, lng: 110.5084 },
    'magelang': { lat: -7.4797, lng: 110.2177 },
    'pekalongan': { lat: -6.8886, lng: 109.6753 },
    'tegal': { lat: -6.8694, lng: 109.1402 },
    'kudus': { lat: -6.8048, lng: 110.8405 },
    'jepara': { lat: -6.5924, lng: 110.6778 },
    'demak': { lat: -6.8944, lng: 110.6385 },
    'kendal': { lat: -6.9249, lng: 110.2038 },
    'batang': { lat: -6.9089, lng: 109.7303 },
    'pemalang': { lat: -6.8906, lng: 109.3811 },
    'brebes': { lat: -6.8703, lng: 109.0435 },
    'pati': { lat: -6.7565, lng: 111.0381 },
    'rembang': { lat: -6.7089, lng: 111.3411 },
    'blora': { lat: -6.9698, lng: 111.4184 },
    'boyolali': { lat: -7.5317, lng: 110.5962 },
    'klaten': { lat: -7.7032, lng: 110.6033 },
    'sukoharjo': { lat: -7.6836, lng: 110.8433 },
    'wonogiri': { lat: -7.8144, lng: 110.9252 },
    'karanganyar': { lat: -7.5961, lng: 110.9515 },
    'sragen': { lat: -7.4266, lng: 111.0219 },
    'purworejo': { lat: -7.7156, lng: 110.0078 },
    'kebumen': { lat: -7.6699, lng: 109.6518 },
    'cilacap': { lat: -7.7180, lng: 109.0157 },
    'banyumas': { lat: -7.4243, lng: 109.2302 },
    'purwokerto': { lat: -7.4243, lng: 109.2302 },

    // D.I. Yogyakarta
    'yogyakarta': { lat: -7.7956, lng: 110.3695 },
    'kota yogyakarta': { lat: -7.7956, lng: 110.3695 },
    'sleman': { lat: -7.7156, lng: 110.3556 },
    'bantul': { lat: -7.8879, lng: 110.3283 },
    'kulon progo': { lat: -7.8285, lng: 110.1581 },
    'gunungkidul': { lat: -7.9609, lng: 110.6053 },

    // Jawa Timur
    'surabaya': { lat: -7.2575, lng: 112.7521 },
    'kota surabaya': { lat: -7.2575, lng: 112.7521 },
    'malang': { lat: -7.9666, lng: 112.6326 },
    'kota malang': { lat: -7.9666, lng: 112.6326 },
    'kab. malang': { lat: -8.1633, lng: 112.6106 },
    'sidoarjo': { lat: -7.4478, lng: 112.7183 },
    'gresik': { lat: -7.1566, lng: 112.6555 },
    'batu': { lat: -7.8712, lng: 112.5273 },
    'kediri': { lat: -7.8480, lng: 112.0178 },
    'kota kediri': { lat: -7.8480, lng: 112.0178 },
    'madiun': { lat: -7.6298, lng: 111.5239 },
    'blitar': { lat: -8.0983, lng: 112.1681 },
    'mojokerto': { lat: -7.4726, lng: 112.4381 },
    'pasuruan': { lat: -7.6453, lng: 112.9075 },
    'probolinggo': { lat: -7.7543, lng: 113.2159 },
    'banyuwangi': { lat: -8.2192, lng: 114.3691 },
    'jember': { lat: -8.1724, lng: 113.7007 },
    'bojonegoro': { lat: -7.1502, lng: 111.8817 },
    'tuban': { lat: -6.8976, lng: 112.0649 },
    'lamongan': { lat: -7.1205, lng: 112.4158 },
    'jombang': { lat: -7.5460, lng: 112.2331 },
    'nganjuk': { lat: -7.6053, lng: 111.9035 },
    'tulungagung': { lat: -8.0652, lng: 111.9015 },
    'trenggalek': { lat: -8.0505, lng: 111.7088 },
    'ponorogo': { lat: -7.8687, lng: 111.4623 },
    'pacitan': { lat: -8.1979, lng: 111.0963 },

    // Bali
    'denpasar': { lat: -8.6705, lng: 115.2126 },
    'kota denpasar': { lat: -8.6705, lng: 115.2126 },
    'badung': { lat: -8.5819, lng: 115.1771 },
    'gianyar': { lat: -8.5441, lng: 115.3286 },
    'tabanan': { lat: -8.5387, lng: 115.1235 },
    'buleleng': { lat: -8.1120, lng: 115.0882 },
    'singaraja': { lat: -8.1120, lng: 115.0882 },
    'klungkung': { lat: -8.5365, lng: 115.4050 },
    'karangasem': { lat: -8.4487, lng: 115.6074 },
    'bangli': { lat: -8.4543, lng: 115.3550 },
    'jembrana': { lat: -8.3585, lng: 114.6176 },
    'negara': { lat: -8.3585, lng: 114.6176 },

    // Sumatera
    'medan': { lat: 3.5952, lng: 98.6722 },
    'kota medan': { lat: 3.5952, lng: 98.6722 },
    'binjai': { lat: 3.6005, lng: 98.4854 },
    'pematangsiantar': { lat: 2.9599, lng: 99.0687 },
    'deli serdang': { lat: 3.5852, lng: 98.6756 },
    'padang': { lat: -0.9471, lng: 100.4172 },
    'kota padang': { lat: -0.9471, lng: 100.4172 },
    'bukittinggi': { lat: -0.3055, lng: 100.3692 },
    'pekanbaru': { lat: 0.5071, lng: 101.4478 },
    'dumai': { lat: 1.6666, lng: 101.4489 },
    'batam': { lat: 1.1301, lng: 104.0529 },
    'tanjungpinang': { lat: 0.9168, lng: 104.4589 },
    'bintan': { lat: 1.0500, lng: 104.5500 },
    'palembang': { lat: -2.9761, lng: 104.7754 },
    'bandar lampung': { lat: -5.4500, lng: 105.2667 },
    'metro': { lat: -5.1136, lng: 105.3069 },
    'jambi': { lat: -1.6101, lng: 103.6131 },
    'bengkulu': { lat: -3.7928, lng: 102.2608 },
    'pangkalpinang': { lat: -2.1316, lng: 106.1169 },
    'banda aceh': { lat: 5.5483, lng: 95.3238 },
    'lhokseumawe': { lat: 5.1801, lng: 97.1407 },

    // Kalimantan
    'samarinda': { lat: -0.5022, lng: 117.1537 },
    'balikpapan': { lat: -1.2654, lng: 116.8312 },
    'kota balikpapan': { lat: -1.2654, lng: 116.8312 },
    'penajam paser': { lat: -0.9634, lng: 116.7027 },
    'penajam paser (ikn)': { lat: -0.9634, lng: 116.7027 },
    'bontang': { lat: 0.1337, lng: 117.4678 },
    'banjarmasin': { lat: -3.3194, lng: 114.5908 },
    'banjarbaru': { lat: -3.4572, lng: 114.8103 },
    'pontianak': { lat: -0.0263, lng: 109.3425 },
    'singkawang': { lat: 0.9071, lng: 108.9845 },
    'palangka raya': { lat: -2.2161, lng: 113.9139 },
    'tarakan': { lat: 3.3270, lng: 117.5965 },
    'tanjung selor': { lat: 2.8375, lng: 117.3653 },

    // Sulawesi
    'makassar': { lat: -5.1477, lng: 119.4327 },
    'kota makassar': { lat: -5.1477, lng: 119.4327 },
    'gowa': { lat: -5.2016, lng: 119.4539 },
    'maros': { lat: -5.0049, lng: 119.5746 },
    'parepare': { lat: -4.0135, lng: 119.6256 },
    'palopo': { lat: -2.9926, lng: 120.1963 },
    'manado': { lat: 1.4748, lng: 124.8421 },
    'bitung': { lat: 1.4404, lng: 125.1217 },
    'tomohon': { lat: 1.3204, lng: 124.8389 },
    'palu': { lat: -0.9003, lng: 119.8779 },
    'kendari': { lat: -3.9985, lng: 122.5126 },
    'gorontalo': { lat: 0.5435, lng: 123.0568 },
    'mamuju': { lat: -2.6770, lng: 118.8890 },

    // Bali & Nusa Tenggara
    'mataram': { lat: -8.5799, lng: 116.0999 },
    'bima': { lat: -8.4617, lng: 118.7265 },
    'kupang': { lat: -10.1772, lng: 123.6070 },
    'labuan bajo': { lat: -8.4964, lng: 119.8877 },
    'manggaraibarat': { lat: -8.4964, lng: 119.8877 },

    // Maluku & Papua
    'ambon': { lat: -3.6547, lng: 128.1906 },
    'ternate': { lat: 0.7904, lng: 127.3804 },
    'jayapura': { lat: -2.5916, lng: 140.6690 },
    'manokwari': { lat: -0.8615, lng: 134.0620 },
    'sorong': { lat: -0.8762, lng: 131.2558 },
    'merauke': { lat: -8.4991, lng: 140.4011 },
    'timika': { lat: -4.5441, lng: 136.8837 },
    'mimika': { lat: -4.5441, lng: 136.8837 },
    'wamena': { lat: -4.0981, lng: 138.9442 },
    'nabire': { lat: -3.3646, lng: 135.4984 },
};

/**
 * Get coordinates for a province.
 */
export const getProvinceCoordinates = (provinceName: string): { lat: number; lng: number } | null => {
    if (!provinceName) return null;
    const clean = provinceName.trim();
    if (PROVINCE_COORDINATES[clean]) {
        return PROVINCE_COORDINATES[clean];
    }
    // Case-insensitive lookup
    const found = Object.keys(PROVINCE_COORDINATES).find(
        (k) => k.toLowerCase() === clean.toLowerCase()
    );
    return found ? PROVINCE_COORDINATES[found] : null;
};

/**
 * Get coordinates for a city/regency, falling back to province coordinates.
 */
export const getCityCoordinates = (
    cityName: string,
    provinceName?: string
): { lat: number; lng: number } | null => {
    if (!cityName) {
        return provinceName ? getProvinceCoordinates(provinceName) : null;
    }

    const clean = cityName.trim().toLowerCase();
    
    // Direct match
    if (CITY_COORDINATES[clean]) {
        return CITY_COORDINATES[clean];
    }

    // Normalized match (strip prefixes like 'kota ', 'kab. ', 'kabupaten ')
    const stripped = clean.replace(/^(kota|kab\.|kabupaten)\s+/i, '').trim();
    if (CITY_COORDINATES[stripped]) {
        return CITY_COORDINATES[stripped];
    }

    // Partial word search
    const matchedKey = Object.keys(CITY_COORDINATES).find((key) => 
        key.includes(stripped) || stripped.includes(key)
    );
    if (matchedKey) {
        return CITY_COORDINATES[matchedKey];
    }

    // Fall back to province coordinates
    if (provinceName) {
        return getProvinceCoordinates(provinceName);
    }

    return null;
};

/**
 * Normalizes province name from geocoder (English/Indonesian/abbreviations) to official canonical name.
 */
export const normalizeProvinceName = (prov: string): string => {
    if (!prov) return '';
    const clean = prov.trim().toLowerCase();

    const aliasMap: Record<string, string> = {
        'central java': 'Jawa Tengah',
        'west java': 'Jawa Barat',
        'east java': 'Jawa Timur',
        'special capital region of jakarta': 'DKI Jakarta',
        'jakarta': 'DKI Jakarta',
        'dki jakarta': 'DKI Jakarta',
        'daerah khusus ibukota jakarta': 'DKI Jakarta',
        'special region of yogyakarta': 'D.I. Yogyakarta',
        'yogyakarta': 'D.I. Yogyakarta',
        'di yogyakarta': 'D.I. Yogyakarta',
        'daerah istimewa yogyakarta': 'D.I. Yogyakarta',
        'north sumatra': 'Sumatera Utara',
        'west sumatra': 'Sumatera Barat',
        'south sumatra': 'Sumatera Selatan',
        'west kalimantan': 'Kalimantan Barat',
        'east kalimantan': 'Kalimantan Timur',
        'south kalimantan': 'Kalimantan Selatan',
        'central kalimantan': 'Kalimantan Tengah',
        'north kalimantan': 'Kalimantan Utara',
        'south sulawesi': 'Sulawesi Selatan',
        'north sulawesi': 'Sulawesi Utara',
        'central sulawesi': 'Sulawesi Tengah',
        'southeast sulawesi': 'Sulawesi Tenggara',
        'west sulawesi': 'Sulawesi Barat',
        'bali': 'Bali',
        'aceh': 'Aceh',
        'riau': 'Riau',
        'jambi': 'Jambi',
        'lampung': 'Lampung',
        'banten': 'Banten',
    };

    if (aliasMap[clean]) {
        return aliasMap[clean];
    }

    const found = INDONESIA_REGIONS.find((r) => {
        const rName = r.name.toLowerCase();
        return rName === clean || clean.includes(rName) || rName.includes(clean);
    });

    return found ? found.name : prov.trim();
};

/**
 * Normalizes city name from geocoder (e.g. "Surakarta", "Surakarta City", "Solo")
 * to the exact option value present in getCitiesByProvince(province).
 */
export const normalizeCityName = (city: string, provinceName?: string): string => {
    if (!city) return '';
    const cleanCity = city.trim().toLowerCase().replace(/^(kota|kabupaten|kab\.)\s+/i, '').replace(/\s+(city|regency)$/i, '').trim();

    const canonicalProv = provinceName ? normalizeProvinceName(provinceName) : '';
    const regionsToCheck = canonicalProv 
        ? INDONESIA_REGIONS.filter(r => r.name.toLowerCase() === canonicalProv.toLowerCase())
        : INDONESIA_REGIONS;

    for (const region of regionsToCheck) {
        // 1. Exact clean match
        for (const c of region.cities) {
            const cleanC = c.toLowerCase().replace(/^(kota|kabupaten|kab\.)\s+/i, '').replace(/\s+(city|regency)$/i, '').trim();
            if (cleanC === cleanCity) {
                return c;
            }
        }

        // 2. Substring match (e.g. "surakarta" matches "Surakarta (Solo)", "solo" matches "Surakarta (Solo)")
        for (const c of region.cities) {
            const cleanC = c.toLowerCase().replace(/^(kota|kabupaten|kab\.)\s+/i, '').replace(/\s+(city|regency)$/i, '').trim();
            if (cleanC.includes(cleanCity) || cleanCity.includes(cleanC)) {
                return c;
            }
        }
    }

    return city.trim();
};
