-- ============================================================
-- SEED: Marcas, Modelos, Versões e Cores
-- Carros vendidos no Brasil — dados de referência
--
-- Compatível com SQL Server
-- Seguro para executar múltiplas vezes (não duplica dados)
-- ============================================================

SET NOCOUNT ON;

DECLARE @marcas_inseridas   INT = 0;
DECLARE @modelos_inseridos  INT = 0;
DECLARE @versoes_inseridas  INT = 0;
DECLARE @cores_inseridas    INT = 0;

PRINT '============================================================';
PRINT ' Iniciando seed de veículos...';
PRINT '============================================================';

-- ============================================================
-- MARCAS
-- ============================================================
;WITH novas AS (
  SELECT nome FROM (VALUES
    ('Volkswagen'),
    ('Chevrolet'),
    ('Fiat'),
    ('Ford'),
    ('Toyota'),
    ('Honda'),
    ('Hyundai'),
    ('Renault'),
    ('Jeep'),
    ('Nissan'),
    ('Citroën'),
    ('Peugeot'),
    ('Mitsubishi'),
    ('Kia'),
    ('BMW'),
    ('Mercedes-Benz'),
    ('Audi')
  ) AS t(nome)
)
INSERT INTO marcas (nome)
SELECT n.nome FROM novas n
WHERE NOT EXISTS (SELECT 1 FROM marcas WHERE nome = n.nome);

SET @marcas_inseridas = @@ROWCOUNT;
PRINT CONCAT('  Marcas inseridas:  ', @marcas_inseridas);

-- ============================================================
-- MODELOS
-- ============================================================
;WITH novos AS (
  SELECT ma.id AS marca_id, mo.nome
  FROM (VALUES
    -- Volkswagen
    ('Volkswagen', 'Gol'),
    ('Volkswagen', 'Polo'),
    ('Volkswagen', 'Virtus'),
    ('Volkswagen', 'T-Cross'),
    ('Volkswagen', 'Tiguan'),
    ('Volkswagen', 'Jetta'),
    ('Volkswagen', 'Saveiro'),
    ('Volkswagen', 'Amarok'),
    -- Chevrolet
    ('Chevrolet', 'Onix'),
    ('Chevrolet', 'Onix Plus'),
    ('Chevrolet', 'Tracker'),
    ('Chevrolet', 'S10'),
    ('Chevrolet', 'Montana'),
    ('Chevrolet', 'Cruze'),
    ('Chevrolet', 'Spin'),
    -- Fiat
    ('Fiat', 'Argo'),
    ('Fiat', 'Cronos'),
    ('Fiat', 'Pulse'),
    ('Fiat', 'Fastback'),
    ('Fiat', 'Strada'),
    ('Fiat', 'Toro'),
    ('Fiat', 'Mobi'),
    -- Ford
    ('Ford', 'EcoSport'),
    ('Ford', 'Ranger'),
    ('Ford', 'Territory'),
    ('Ford', 'Maverick'),
    ('Ford', 'Bronco Sport'),
    ('Ford', 'Ka'),
    -- Toyota
    ('Toyota', 'Corolla'),
    ('Toyota', 'Yaris'),
    ('Toyota', 'Corolla Cross'),
    ('Toyota', 'Hilux'),
    ('Toyota', 'SW4'),
    ('Toyota', 'RAV4'),
    -- Honda
    ('Honda', 'Civic'),
    ('Honda', 'City'),
    ('Honda', 'HR-V'),
    ('Honda', 'CR-V'),
    ('Honda', 'WR-V'),
    -- Hyundai
    ('Hyundai', 'HB20'),
    ('Hyundai', 'HB20S'),
    ('Hyundai', 'Creta'),
    ('Hyundai', 'Tucson'),
    ('Hyundai', 'i30'),
    -- Renault
    ('Renault', 'Kwid'),
    ('Renault', 'Sandero'),
    ('Renault', 'Logan'),
    ('Renault', 'Duster'),
    ('Renault', 'Captur'),
    ('Renault', 'Oroch'),
    -- Jeep
    ('Jeep', 'Renegade'),
    ('Jeep', 'Compass'),
    ('Jeep', 'Commander'),
    ('Jeep', 'Wrangler'),
    -- Nissan
    ('Nissan', 'Kicks'),
    ('Nissan', 'Versa'),
    ('Nissan', 'Sentra'),
    ('Nissan', 'Frontier'),
    -- Citroën
    ('Citroën', 'C3'),
    ('Citroën', 'C4 Cactus'),
    ('Citroën', 'Aircross'),
    -- Peugeot
    ('Peugeot', '208'),
    ('Peugeot', '2008'),
    ('Peugeot', '3008'),
    -- Mitsubishi
    ('Mitsubishi', 'ASX'),
    ('Mitsubishi', 'Eclipse Cross'),
    ('Mitsubishi', 'L200 Triton'),
    ('Mitsubishi', 'Pajero Sport'),
    -- Kia
    ('Kia', 'Sportage'),
    ('Kia', 'Seltos'),
    ('Kia', 'Carnival'),
    -- BMW
    ('BMW', '320i'),
    ('BMW', '530i'),
    ('BMW', 'X1'),
    ('BMW', 'X3'),
    ('BMW', 'X5'),
    -- Mercedes-Benz
    ('Mercedes-Benz', 'A 200'),
    ('Mercedes-Benz', 'C 200'),
    ('Mercedes-Benz', 'GLA 200'),
    ('Mercedes-Benz', 'GLB 200'),
    ('Mercedes-Benz', 'GLC 300'),
    -- Audi
    ('Audi', 'A3'),
    ('Audi', 'A4'),
    ('Audi', 'Q3'),
    ('Audi', 'Q5')
  ) AS mo(marca_nome, nome)
  JOIN marcas ma ON ma.nome = mo.marca_nome
)
INSERT INTO modelos (marca_id, nome)
SELECT n.marca_id, n.nome FROM novos n
WHERE NOT EXISTS (
  SELECT 1 FROM modelos m WHERE m.marca_id = n.marca_id AND m.nome = n.nome
);

SET @modelos_inseridos = @@ROWCOUNT;
PRINT CONCAT('  Modelos inseridos:  ', @modelos_inseridos);

-- ============================================================
-- VERSÕES
-- ============================================================
;WITH novas AS (
  SELECT mo.id AS modelo_id, v.nome
  FROM (VALUES
    -- ======== Volkswagen Gol ========
    ('Volkswagen', 'Gol',        '1.0 MPI Trendline'),
    ('Volkswagen', 'Gol',        '1.0 MPI Comfortline'),

    -- ======== Volkswagen Polo ========
    ('Volkswagen', 'Polo',       '1.0 MPI'),
    ('Volkswagen', 'Polo',       '1.0 TSI Comfortline'),
    ('Volkswagen', 'Polo',       '1.0 TSI Highline'),
    ('Volkswagen', 'Polo',       'GTS 1.4 TSI'),

    -- ======== Volkswagen Virtus ========
    ('Volkswagen', 'Virtus',     '1.0 MSI'),
    ('Volkswagen', 'Virtus',     '1.0 TSI Comfortline'),
    ('Volkswagen', 'Virtus',     '1.0 TSI Highline'),

    -- ======== Volkswagen T-Cross ========
    ('Volkswagen', 'T-Cross',    '1.0 TSI Sense'),
    ('Volkswagen', 'T-Cross',    '1.0 TSI Comfortline'),
    ('Volkswagen', 'T-Cross',    '1.4 TSI Highline'),
    ('Volkswagen', 'T-Cross',    '1.4 TSI R-Line'),

    -- ======== Volkswagen Tiguan ========
    ('Volkswagen', 'Tiguan',     '1.4 TSI Comfortline'),
    ('Volkswagen', 'Tiguan',     '1.4 TSI Highline'),
    ('Volkswagen', 'Tiguan',     '2.0 TSI R-Line'),

    -- ======== Volkswagen Jetta ========
    ('Volkswagen', 'Jetta',      '1.4 TSI Comfortline'),
    ('Volkswagen', 'Jetta',      '1.4 TSI Highline'),
    ('Volkswagen', 'Jetta',      '2.0 TSI GLI R-Line'),

    -- ======== Volkswagen Saveiro ========
    ('Volkswagen', 'Saveiro',    '1.6 MSI Trendline CS'),
    ('Volkswagen', 'Saveiro',    '1.6 MSI Comfortline CS'),
    ('Volkswagen', 'Saveiro',    '1.6 MSI Comfortline CD'),

    -- ======== Volkswagen Amarok ========
    ('Volkswagen', 'Amarok',     'V6 3.0 TDI Comfortline 4x4 AT'),
    ('Volkswagen', 'Amarok',     'V6 3.0 TDI Highline 4x4 AT'),
    ('Volkswagen', 'Amarok',     'V6 3.0 TDI Extreme 4x4 AT'),

    -- ======== Chevrolet Onix ========
    ('Chevrolet',  'Onix',       '1.0 Joy'),
    ('Chevrolet',  'Onix',       '1.0 Turbo LT'),
    ('Chevrolet',  'Onix',       '1.0 Turbo LTZ'),
    ('Chevrolet',  'Onix',       '1.0 Turbo Premier'),

    -- ======== Chevrolet Onix Plus ========
    ('Chevrolet',  'Onix Plus',  '1.0 Joy'),
    ('Chevrolet',  'Onix Plus',  '1.0 Turbo LT'),
    ('Chevrolet',  'Onix Plus',  '1.0 Turbo LTZ'),
    ('Chevrolet',  'Onix Plus',  '1.0 Turbo Premier'),

    -- ======== Chevrolet Tracker ========
    ('Chevrolet',  'Tracker',    '1.0 Turbo LT'),
    ('Chevrolet',  'Tracker',    '1.0 Turbo Midnight'),
    ('Chevrolet',  'Tracker',    '1.0 Turbo Premier'),

    -- ======== Chevrolet S10 ========
    ('Chevrolet',  'S10',        '2.5 FlexPower LS CD MT'),
    ('Chevrolet',  'S10',        '2.8 TD LT CD AT'),
    ('Chevrolet',  'S10',        '2.8 TD LTZ CD 4x4 AT'),
    ('Chevrolet',  'S10',        '2.8 TD High Country CD 4x4 AT'),

    -- ======== Chevrolet Montana ========
    ('Chevrolet',  'Montana',    '1.2 Turbo Trail AT'),
    ('Chevrolet',  'Montana',    '1.2 Turbo Spirit AT'),
    ('Chevrolet',  'Montana',    '1.2 Turbo Premier AT'),

    -- ======== Chevrolet Cruze ========
    ('Chevrolet',  'Cruze',      '1.4 Turbo LT AT'),
    ('Chevrolet',  'Cruze',      '1.4 Turbo LTZ AT'),
    ('Chevrolet',  'Cruze',      '1.4 Turbo Premier AT'),

    -- ======== Chevrolet Spin ========
    ('Chevrolet',  'Spin',       '1.0 Turbo LT AT'),
    ('Chevrolet',  'Spin',       '1.8 LT AT'),
    ('Chevrolet',  'Spin',       '1.8 LTZ AT'),

    -- ======== Fiat Argo ========
    ('Fiat',       'Argo',       '1.0 GSE Drive MT'),
    ('Fiat',       'Argo',       '1.3 GSE Drive CVT'),
    ('Fiat',       'Argo',       '1.8 Trekking AT'),

    -- ======== Fiat Cronos ========
    ('Fiat',       'Cronos',     '1.3 GSE Drive MT'),
    ('Fiat',       'Cronos',     '1.3 GSE Precision CVT'),

    -- ======== Fiat Pulse ========
    ('Fiat',       'Pulse',      '1.0 Drive MT'),
    ('Fiat',       'Pulse',      '1.0 Turbo 200 Impetus AT'),
    ('Fiat',       'Pulse',      '1.0 Turbo 200 Audace AT'),

    -- ======== Fiat Fastback ========
    ('Fiat',       'Fastback',   '1.0 Turbo 200 Impetus AT'),
    ('Fiat',       'Fastback',   '1.0 Turbo 200 Audace AT'),
    ('Fiat',       'Fastback',   'Abarth 1.3 Turbo 270 AT'),

    -- ======== Fiat Strada ========
    ('Fiat',       'Strada',     '1.3 Firefly Freedom CS MT'),
    ('Fiat',       'Strada',     '1.3 Firefly Endurance CD AT'),
    ('Fiat',       'Strada',     '2.0 Turbo Ranch CD AT'),

    -- ======== Fiat Toro ========
    ('Fiat',       'Toro',       '1.3 Turbo Freedom MT'),
    ('Fiat',       'Toro',       '2.0 TD Volcano 4x4 AT'),
    ('Fiat',       'Toro',       '2.0 TD Ultra 4x4 AT'),

    -- ======== Fiat Mobi ========
    ('Fiat',       'Mobi',       '1.0 Easy MT'),
    ('Fiat',       'Mobi',       '1.0 Like MT'),

    -- ======== Ford EcoSport ========
    ('Ford',       'EcoSport',   '1.5 SE MT'),
    ('Ford',       'EcoSport',   '1.5 SEL AT'),
    ('Ford',       'EcoSport',   '2.0 Titanium AT'),

    -- ======== Ford Ranger ========
    ('Ford',       'Ranger',     '2.0 Biturbo XLS CD AT'),
    ('Ford',       'Ranger',     '2.0 Biturbo XLT CD AT'),
    ('Ford',       'Ranger',     '2.0 Biturbo Limited CD AT'),
    ('Ford',       'Ranger',     '3.0 V6 Raptor CD AT'),

    -- ======== Ford Territory ========
    ('Ford',       'Territory',  '1.5 EcoBoost SEL AT'),
    ('Ford',       'Territory',  '1.5 EcoBoost Titanium AT'),

    -- ======== Ford Maverick ========
    ('Ford',       'Maverick',   '2.0 EcoBoost XLT AWD AT'),
    ('Ford',       'Maverick',   '2.0 EcoBoost Lariat AWD AT'),

    -- ======== Ford Bronco Sport ========
    ('Ford',       'Bronco Sport', '2.0 EcoBoost Big Bend AT'),
    ('Ford',       'Bronco Sport', '2.0 EcoBoost Badlands AT'),

    -- ======== Ford Ka ========
    ('Ford',       'Ka',         '1.0 SE MT'),
    ('Ford',       'Ka',         '1.0 SE Plus MT'),
    ('Ford',       'Ka',         '1.5 SEL AT'),

    -- ======== Toyota Corolla ========
    ('Toyota',     'Corolla',    '1.8 GLi MT'),
    ('Toyota',     'Corolla',    '2.0 XEi CVT'),
    ('Toyota',     'Corolla',    '2.0 Altis CVT'),
    ('Toyota',     'Corolla',    '2.0 GR Sport CVT'),

    -- ======== Toyota Yaris ========
    ('Toyota',     'Yaris',      '1.3 XL MT'),
    ('Toyota',     'Yaris',      '1.5 XS CVT'),
    ('Toyota',     'Yaris',      '1.5 XLS CVT'),
    ('Toyota',     'Yaris',      '1.5 GR-S CVT'),

    -- ======== Toyota Corolla Cross ========
    ('Toyota',     'Corolla Cross', '2.0 VVT-iE XRei CVT'),
    ('Toyota',     'Corolla Cross', '2.0 VVT-iE XRV CVT'),

    -- ======== Toyota Hilux ========
    ('Toyota',     'Hilux',      '2.7 SR CD MT'),
    ('Toyota',     'Hilux',      '2.8 SRV CD AT'),
    ('Toyota',     'Hilux',      '2.8 SRX CD 4x4 AT'),
    ('Toyota',     'Hilux',      '2.8 GR Sport CD 4x4 AT'),

    -- ======== Toyota SW4 ========
    ('Toyota',     'SW4',        '2.8 SRV 4x2 AT'),
    ('Toyota',     'SW4',        '2.8 SRX 4x4 AT'),
    ('Toyota',     'SW4',        '2.8 GR Sport 4x4 AT'),

    -- ======== Toyota RAV4 ========
    ('Toyota',     'RAV4',       '2.5 Adventure AWD AT'),
    ('Toyota',     'RAV4',       '2.5 Hybrid Adventure AWD AT'),

    -- ======== Honda Civic ========
    ('Honda',      'Civic',      '2.0 LX CVT'),
    ('Honda',      'Civic',      '1.5 Turbo Sport CVT'),
    ('Honda',      'Civic',      '1.5 Turbo EXL CVT'),

    -- ======== Honda City ========
    ('Honda',      'City',       '1.5 DX CVT'),
    ('Honda',      'City',       '1.5 EX CVT'),
    ('Honda',      'City',       '1.5 EXL CVT'),
    ('Honda',      'City',       '1.5 Touring CVT'),

    -- ======== Honda HR-V ========
    ('Honda',      'HR-V',       '1.5 LX CVT'),
    ('Honda',      'HR-V',       '1.5 EX CVT'),
    ('Honda',      'HR-V',       '2.0 EXL CVT'),

    -- ======== Honda CR-V ========
    ('Honda',      'CR-V',       '1.5 Turbo EX CVT'),
    ('Honda',      'CR-V',       '1.5 Turbo Touring CVT AWD'),

    -- ======== Honda WR-V ========
    ('Honda',      'WR-V',       '1.0 Turbo EXL CVT'),
    ('Honda',      'WR-V',       '1.0 Turbo Touring CVT'),

    -- ======== Hyundai HB20 ========
    ('Hyundai',    'HB20',       '1.0 Sense MT'),
    ('Hyundai',    'HB20',       '1.0 Turbo Evolution AT'),
    ('Hyundai',    'HB20',       '1.0 Turbo Sport AT'),

    -- ======== Hyundai HB20S ========
    ('Hyundai',    'HB20S',      '1.0 Sense MT'),
    ('Hyundai',    'HB20S',      '1.0 Turbo Platinum AT'),

    -- ======== Hyundai Creta ========
    ('Hyundai',    'Creta',      '1.0 Turbo Action AT'),
    ('Hyundai',    'Creta',      '1.0 Turbo Platinum AT'),
    ('Hyundai',    'Creta',      '1.0 Turbo Ultimate AT'),

    -- ======== Hyundai Tucson ========
    ('Hyundai',    'Tucson',     '1.6 TGDI GL AT'),
    ('Hyundai',    'Tucson',     '1.6 TGDI Platinum AT'),
    ('Hyundai',    'Tucson',     '1.6 TGDI N Line AT'),

    -- ======== Hyundai i30 ========
    ('Hyundai',    'i30',        '1.0 Turbo N Line AT'),
    ('Hyundai',    'i30',        '2.0 N Performance MT'),

    -- ======== Renault Kwid ========
    ('Renault',    'Kwid',       '1.0 SCe Zen MT'),
    ('Renault',    'Kwid',       '1.0 SCe Intense MT'),
    ('Renault',    'Kwid',       '1.0 Turbo Outsider CVT'),

    -- ======== Renault Sandero ========
    ('Renault',    'Sandero',    '1.0 Zen MT'),
    ('Renault',    'Sandero',    '1.6 Stepway CVT'),

    -- ======== Renault Logan ========
    ('Renault',    'Logan',      '1.0 Zen MT'),
    ('Renault',    'Logan',      '1.6 Iconic CVT'),

    -- ======== Renault Duster ========
    ('Renault',    'Duster',     '1.3 Turbo Iconic CVT'),
    ('Renault',    'Duster',     '2.0 Iconic CVT'),

    -- ======== Renault Captur ========
    ('Renault',    'Captur',     '1.3 Turbo Iconic CVT'),

    -- ======== Renault Oroch ========
    ('Renault',    'Oroch',      '1.3 Turbo Outsider+ AT'),
    ('Renault',    'Oroch',      '1.6 Outsider CD MT'),

    -- ======== Jeep Renegade ========
    ('Jeep',       'Renegade',   '1.3 T270 Sport AT'),
    ('Jeep',       'Renegade',   '1.3 T270 Longitude AT'),
    ('Jeep',       'Renegade',   '2.0 TD350 Trailhawk AT'),
    ('Jeep',       'Renegade',   '4xe Sport PHEV AT'),

    -- ======== Jeep Compass ========
    ('Jeep',       'Compass',    '1.3 T270 Sport AT'),
    ('Jeep',       'Compass',    '1.3 T270 Longitude AT'),
    ('Jeep',       'Compass',    '2.0 TD350 Trailhawk AT'),

    -- ======== Jeep Commander ========
    ('Jeep',       'Commander',  '1.3 T270 Sport AT'),
    ('Jeep',       'Commander',  '2.0 TD350 Overland AT'),
    ('Jeep',       'Commander',  '2.0 TD350 Trailhawk AT'),

    -- ======== Jeep Wrangler ========
    ('Jeep',       'Wrangler',   '2.0 Turbo Sahara 4x4 AT'),
    ('Jeep',       'Wrangler',   '2.0 Turbo Rubicon 4x4 AT'),

    -- ======== Nissan Kicks ========
    ('Nissan',     'Kicks',      '1.6 S MT'),
    ('Nissan',     'Kicks',      '1.6 SV CVT'),
    ('Nissan',     'Kicks',      '1.6 SL CVT'),
    ('Nissan',     'Kicks',      'Exclusive 1.6 CVT'),

    -- ======== Nissan Versa ========
    ('Nissan',     'Versa',      '1.6 S MT'),
    ('Nissan',     'Versa',      '1.6 SV CVT'),
    ('Nissan',     'Versa',      '1.6 SL CVT'),

    -- ======== Nissan Sentra ========
    ('Nissan',     'Sentra',     '2.0 SV CVT'),
    ('Nissan',     'Sentra',     '2.0 SL CVT'),

    -- ======== Nissan Frontier ========
    ('Nissan',     'Frontier',   '2.3 S CD AT'),
    ('Nissan',     'Frontier',   '2.3 SV CD AT'),
    ('Nissan',     'Frontier',   '2.3 PRO-4X CD AT 4x4'),

    -- ======== Citroën C3 ========
    ('Citroën',    'C3',         '1.0 Feel MT'),
    ('Citroën',    'C3',         '1.0 Feel Pack MT'),
    ('Citroën',    'C3',         '1.0 Shine Pack AT'),

    -- ======== Citroën C4 Cactus ========
    ('Citroën',    'C4 Cactus',  '1.6 Feel AT'),
    ('Citroën',    'C4 Cactus',  '1.6 Shine AT'),

    -- ======== Citroën Aircross ========
    ('Citroën',    'Aircross',   '1.6 Feel AT'),
    ('Citroën',    'Aircross',   '1.6 Shine AT'),
    ('Citroën',    'Aircross',   '2.0 Business AT'),

    -- ======== Peugeot 208 ========
    ('Peugeot',    '208',        '1.0 Active MT'),
    ('Peugeot',    '208',        '1.0 Like AT'),
    ('Peugeot',    '208',        '1.6 Griffe AT'),

    -- ======== Peugeot 2008 ========
    ('Peugeot',    '2008',       '1.0 Turbo Active AT'),
    ('Peugeot',    '2008',       '1.0 Turbo Allure AT'),
    ('Peugeot',    '2008',       '1.0 Turbo Griffe AT'),

    -- ======== Peugeot 3008 ========
    ('Peugeot',    '3008',       '1.6 THP Allure AT'),
    ('Peugeot',    '3008',       '1.6 THP Griffe AT'),

    -- ======== Mitsubishi ASX ========
    ('Mitsubishi', 'ASX',        '2.0 AWC CVT'),

    -- ======== Mitsubishi Eclipse Cross ========
    ('Mitsubishi', 'Eclipse Cross', '1.5 Turbo HPE-S AWC CVT'),

    -- ======== Mitsubishi L200 Triton ========
    ('Mitsubishi', 'L200 Triton', '2.4 HPE CD MT'),
    ('Mitsubishi', 'L200 Triton', '2.4 HPE-S CD AT'),
    ('Mitsubishi', 'L200 Triton', '2.4 Sport SR CD AT'),

    -- ======== Mitsubishi Pajero Sport ========
    ('Mitsubishi', 'Pajero Sport', '2.4 HPE-S 4WD AT'),

    -- ======== Kia Sportage ========
    ('Kia',        'Sportage',   '1.0 Turbo LX MT'),
    ('Kia',        'Sportage',   '2.0 EX AT'),
    ('Kia',        'Sportage',   '2.0 EX Midnight AT'),

    -- ======== Kia Seltos ========
    ('Kia',        'Seltos',     '1.6 Turbo SX AT'),

    -- ======== Kia Carnival ========
    ('Kia',        'Carnival',   '3.5 LX AT'),
    ('Kia',        'Carnival',   '3.5 SX Premium AT'),

    -- ======== BMW 320i ========
    ('BMW',        '320i',       '2.0 TwinPower Sport AT'),
    ('BMW',        '320i',       '2.0 TwinPower M Sport AT'),

    -- ======== BMW 530i ========
    ('BMW',        '530i',       '2.0 TwinPower Luxury AT'),
    ('BMW',        '530i',       '2.0 TwinPower M Sport AT'),

    -- ======== BMW X1 ========
    ('BMW',        'X1',         '1.5 sDrive20i Activity AT'),

    -- ======== BMW X3 ========
    ('BMW',        'X3',         '2.0 xDrive20i xLine AT'),
    ('BMW',        'X3',         '2.0 xDrive30e M Sport AT'),

    -- ======== BMW X5 ========
    ('BMW',        'X5',         '3.0 xDrive50e M Sport AT'),

    -- ======== Mercedes-Benz A 200 ========
    ('Mercedes-Benz', 'A 200',   '1.3 Turbo Progressive AT'),
    ('Mercedes-Benz', 'A 200',   '1.3 Turbo AMG Line AT'),

    -- ======== Mercedes-Benz C 200 ========
    ('Mercedes-Benz', 'C 200',   '1.5 EQ Boost Avantgarde AT'),
    ('Mercedes-Benz', 'C 200',   '1.5 EQ Boost AMG Line AT'),

    -- ======== Mercedes-Benz GLA 200 ========
    ('Mercedes-Benz', 'GLA 200', '1.3 Turbo Progressive AT'),
    ('Mercedes-Benz', 'GLA 200', '1.3 Turbo AMG Line AT'),

    -- ======== Mercedes-Benz GLB 200 ========
    ('Mercedes-Benz', 'GLB 200', '1.3 Turbo Progressive AT'),
    ('Mercedes-Benz', 'GLB 200', '1.3 Turbo AMG Line AT'),

    -- ======== Mercedes-Benz GLC 300 ========
    ('Mercedes-Benz', 'GLC 300', '2.0 Turbo 4Matic Avantgarde AT'),
    ('Mercedes-Benz', 'GLC 300', '2.0 Turbo 4Matic AMG Line AT'),

    -- ======== Audi A3 ========
    ('Audi',       'A3',         '1.4 TFSI Attraction AT'),
    ('Audi',       'A3',         '1.4 TFSI Prestige AT'),
    ('Audi',       'A3',         '2.0 TFSI S Line Quattro AT'),

    -- ======== Audi A4 ========
    ('Audi',       'A4',         '2.0 TFSI Prestige Plus AT'),

    -- ======== Audi Q3 ========
    ('Audi',       'Q3',         '1.4 TFSI Prestige AT'),
    ('Audi',       'Q3',         '2.0 TFSI S Line Quattro AT'),

    -- ======== Audi Q5 ========
    ('Audi',       'Q5',         '2.0 TFSI Prestige Plus AT'),
    ('Audi',       'Q5',         '2.0 TFSI S Line Quattro AT')

  ) AS v(marca_nome, modelo_nome, nome)
  JOIN marcas  ma ON ma.nome              = v.marca_nome
  JOIN modelos mo ON mo.marca_id = ma.id AND mo.nome = v.modelo_nome
)
INSERT INTO versoes (modelo_id, nome)
SELECT n.modelo_id, n.nome FROM novas n
WHERE NOT EXISTS (
  SELECT 1 FROM versoes v WHERE v.modelo_id = n.modelo_id AND v.nome = n.nome
);

SET @versoes_inseridas = @@ROWCOUNT;
PRINT CONCAT('  Versões inseridas:  ', @versoes_inseridas);

-- ============================================================
-- CORES
-- ============================================================
;WITH novas AS (
  SELECT nome FROM (VALUES
    ('Branco'),
    ('Preto'),
    ('Prata'),
    ('Cinza'),
    ('Grafite'),
    ('Vermelho'),
    ('Azul'),
    ('Azul Marinho'),
    ('Verde'),
    ('Bege'),
    ('Champagne'),
    ('Dourado'),
    ('Amarelo'),
    ('Laranja'),
    ('Vinho'),
    ('Marrom'),
    ('Rosa'),
    ('Roxo'),
    ('Bronze')
  ) AS t(nome)
)
INSERT INTO cores (nome)
SELECT n.nome FROM novas n
WHERE NOT EXISTS (SELECT 1 FROM cores WHERE nome = n.nome);

SET @cores_inseridas = @@ROWCOUNT;
PRINT CONCAT('  Cores inseridas:    ', @cores_inseridas);

-- ============================================================
-- Resumo
-- ============================================================
PRINT '============================================================';
PRINT ' Seed concluído com sucesso!';
PRINT CONCAT(' Total inserido — Marcas: ', @marcas_inseridas,
             ' | Modelos: ', @modelos_inseridos,
             ' | Versões: ', @versoes_inseridas,
             ' | Cores: ',   @cores_inseridas);
PRINT '============================================================';

-- Totais atuais nas tabelas
SELECT 'marcas'  AS tabela, COUNT(*) AS total FROM marcas  UNION ALL
SELECT 'modelos' AS tabela, COUNT(*) AS total FROM modelos UNION ALL
SELECT 'versoes' AS tabela, COUNT(*) AS total FROM versoes UNION ALL
SELECT 'cores'   AS tabela, COUNT(*) AS total FROM cores;
