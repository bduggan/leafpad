use 5.016;

use strict;
use warnings;

use ExtUtils::MakeMaker;

WriteMakefile(
  NAME         => 'Leafpad',
  VERSION      => '0.01',
  ABSTRACT     => 'Geospatial Exploration Platform',
  AUTHOR       => 'Brian Duggan <bduggan@matatu.org>',
  LICENSE      => 'mit',
  META_MERGE   => {
    dynamic_config => 0,
    resources => {
      bugtracker => {web => 'https://github.com/bduggan/leafpad/issues'},
      repository => {
        type => 'git',
        url  => 'https://github.com/bduggan/leafpad.git',
        web  => 'https://github.com/bduggan/leafpad',
      },
    },
  },
  test => {TESTS => 't/*.t'},
  PREREQ_PM => {'Text::CSV_XS' => '1.48', 'Mojolicious' => '9.23'},
  EXE_FILES => [ 'leafpad' ],
);
