package Leafpad;

use Mojo::File qw/curfile/;

sub home {
  curfile->sibling('Leafpad')
}

1
