BEGIN { $ENV{MOJO_MODE} = 'testing'; }

use Test::More;
use Test::Mojo;
use Mojo::File qw(curfile);

my $t = Test::Mojo->new(curfile->dirname->child('../leafpad'));

$t->get_ok('/')->status_is(200);

done_testing();

