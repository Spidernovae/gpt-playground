.PHONY: setup sliding-puzzle solar-system

setup:
	@yarn install

sliding-puzzle:
	@yarn workspace sliding-puzzle dev

solar-system:
	@yarn workspace solar-system dev
